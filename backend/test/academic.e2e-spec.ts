import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';

describe('Academic Workflow (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let schoolAdminToken: string;
    let academicYearId: string;
    let createdClassId: string;
    let createdSubjectId: string;
    let createdStudentId: string;
    let createdEnrollmentId: string;

    beforeAll(async () => {
        jest.setTimeout(30000);
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe());
        await app.init();

        prisma = app.get<PrismaService>(PrismaService);

        // Get Academic Year
        const academicYear = await prisma.academicYear.findFirst();
        if (!academicYear) {
            throw new Error('No academic year found in DB');
        }
        academicYearId = academicYear.id;

        // Login as School Admin
        const loginRes = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'admin@demoschool.edu', password: 'admin123' });
        schoolAdminToken = loginRes.body.accessToken;
    });

    afterAll(async () => {
        // Cleanup in reverse order
        const server = app.getHttpServer();
        const headers = { Authorization: `Bearer ${schoolAdminToken}` };

        if (createdEnrollmentId) await request(server).delete(`/enrollments/${createdEnrollmentId}`).set(headers);
        if (createdStudentId) await request(server).delete(`/students/${createdStudentId}`).set(headers);
        if (createdSubjectId) await request(server).delete(`/subjects/${createdSubjectId}`).set(headers);
        if (createdClassId) await request(server).delete(`/classes/${createdClassId}`).set(headers);

        await app.close();
    });

    it('/classes (POST) - Create Class', async () => {
        const response = await request(app.getHttpServer())
            .post('/classes')
            .set('Authorization', `Bearer ${schoolAdminToken}`)
            .send({ name: 'Test Class 101', grade: '10', section: 'Z', capacity: 25 })
            .expect(201);

        createdClassId = response.body.id;
        expect(createdClassId).toBeDefined();
    });

    it('/subjects (POST) - Create Subject', async () => {
        const response = await request(app.getHttpServer())
            .post('/subjects')
            .set('Authorization', `Bearer ${schoolAdminToken}`)
            .send({ name: 'Test Subject', code: 'TST101', creditHours: 3 })
            .expect(201);

        createdSubjectId = response.body.id;
        expect(createdSubjectId).toBeDefined();
    });

    it('/students (POST) - Create Student', async () => {
        const uniqueId = Date.now();
        const response = await request(app.getHttpServer())
            .post('/students')
            .set('Authorization', `Bearer ${schoolAdminToken}`)
            .send({
                email: `enrollstudent${uniqueId}@school.com`,
                password: 'password123',
                firstName: 'Enroll',
                lastName: 'Me',
                dateOfBirth: '2010-01-01',
                gender: 'FEMALE'
            })
            .expect(201);

        createdStudentId = response.body.id;
        expect(createdStudentId).toBeDefined();
    });

    it('/enrollments (POST) - Enroll Student', async () => {
        const response = await request(app.getHttpServer())
            .post('/enrollments')
            .set('Authorization', `Bearer ${schoolAdminToken}`)
            .send({
                studentId: createdStudentId,
                classId: createdClassId,
                academicYearId: academicYearId
            })
            .expect(201);

        createdEnrollmentId = response.body.id;
        expect(createdEnrollmentId).toBeDefined();
    });

    it('/enrollments (GET) - Verify Enrollment', async () => {
        const response = await request(app.getHttpServer())
            .get('/enrollments')
            .query({ studentId: createdStudentId })
            .set('Authorization', `Bearer ${schoolAdminToken}`)
            .expect(200);

        expect(response.body.data.length).toBeGreaterThan(0);
        expect(response.body.data[0].id).toBe(createdEnrollmentId);
    });
});
