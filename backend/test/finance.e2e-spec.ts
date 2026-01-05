import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';

describe('Finance (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let schoolAdminToken: string;
    let academicYearId: string;
    let createdStudentId: string;
    let createdFeeId: string;
    let createdInvoiceId: string;
    let createdPaymentId: string;

    beforeAll(async () => {
        jest.setTimeout(60000);
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe());
        await app.init();

        prisma = app.get<PrismaService>(PrismaService);

        // Get Academic Year
        const academicYear = await prisma.academicYear.findFirst();
        if (!academicYear) throw new Error('No academic year found');
        academicYearId = academicYear.id;

        // Login as School Admin
        const loginRes = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'admin@demoschool.edu', password: 'admin123' });
        schoolAdminToken = loginRes.body.accessToken;

        // Setup: Create Student
        const uniqueId = Date.now();
        const studentRes = await request(app.getHttpServer())
            .post('/students')
            .set('Authorization', `Bearer ${schoolAdminToken}`)
            .send({
                email: `financestudent${uniqueId}@school.com`,
                password: 'password123',
                firstName: 'Finance',
                lastName: 'Student',
                dateOfBirth: '2010-01-01',
                gender: 'MALE'
            });
        createdStudentId = studentRes.body.id;
    }, 60000);

    afterAll(async () => {
        const server = app.getHttpServer();
        const headers = { Authorization: `Bearer ${schoolAdminToken}` };

        if (createdPaymentId) {
            // No delete endpoint for payments possibly? Check controller.
            // Assuming simplified cleanup or skipping payment delete if not exposed.
        }
        if (createdInvoiceId) await request(server).delete(`/payments/invoices/${createdInvoiceId}`).set(headers);
        if (createdFeeId) await request(server).delete(`/fees/${createdFeeId}`).set(headers);
        if (createdStudentId) await request(server).delete(`/students/${createdStudentId}`).set(headers);

        await app.close();
    });

    it('/fees (POST) - Create Fee Structure', async () => {
        const response = await request(app.getHttpServer())
            .post('/fees')
            .set('Authorization', `Bearer ${schoolAdminToken}`)
            .send({
                name: 'Term 1 Fee',
                amount: 1000,
                description: 'First Term Tuition',
                academicYearId: academicYearId,
                frequency: 'ONE_TIME'
            })
            .expect(201);

        createdFeeId = response.body.id;
        expect(createdFeeId).toBeDefined();
    });

    it('/payments/invoices (POST) - Create Invoice', async () => {
        const response = await request(app.getHttpServer())
            .post('/payments/invoices')
            .set('Authorization', `Bearer ${schoolAdminToken}`)
            .send({
                studentId: createdStudentId,
                dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
                items: [
                    { description: 'Tuition', unitPrice: 1000, quantity: 1 }
                ]
            })
            .expect(201);

        createdInvoiceId = response.body.id;
        expect(createdInvoiceId).toBeDefined();
    });

    it('/payments (POST) - Create Payment', async () => {
        const response = await request(app.getHttpServer())
            .post('/payments')
            .set('Authorization', `Bearer ${schoolAdminToken}`)
            .send({
                invoiceId: createdInvoiceId,
                amount: 1000,
                paymentMethod: 'CASH', // Assuming CASH is valid
                notes: 'Paid in full'
            })
            .expect(201);

        createdPaymentId = response.body.id;
        expect(createdPaymentId).toBeDefined();
    });

    it('/payments (GET) - Verify Payment', async () => {
        const response = await request(app.getHttpServer())
            .get(`/payments/${createdPaymentId}`)
            .set('Authorization', `Bearer ${schoolAdminToken}`)
            .expect(200);

        expect(response.body.amount).toBe(1000);
    });
});
