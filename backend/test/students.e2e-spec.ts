import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Students (e2e)', () => {
    let app: INestApplication;
    let schoolAdminToken: string;
    let createdStudentId: string;

    beforeAll(async () => {
        jest.setTimeout(30000);
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe());
        await app.init();

        // Login as School Admin
        const loginRes = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'admin@demoschool.edu', password: 'admin123' });
        schoolAdminToken = loginRes.body.accessToken;
    });

    afterAll(async () => {
        // Cleanup
        if (createdStudentId) {
            await request(app.getHttpServer())
                .delete(`/students/${createdStudentId}`)
                .set('Authorization', `Bearer ${schoolAdminToken}`);
        }
        await app.close();
    });

    it('/students (POST) - Create a new Student', async () => {
        const uniqueId = Date.now();
        const newStudent = {
            email: `teststudent${uniqueId}@school.com`,
            password: 'password123',
            firstName: 'Test',
            lastName: 'Student',
            dateOfBirth: '2010-01-01',
            gender: 'MALE',
            address: '123 Test St',
        };

        const response = await request(app.getHttpServer())
            .post('/students')
            .set('Authorization', `Bearer ${schoolAdminToken}`)
            .send(newStudent)
            .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.user.email).toBe(newStudent.email);
        createdStudentId = response.body.id;
    });

    it('/students (GET) - List students', async () => {
        const response = await request(app.getHttpServer())
            .get('/students')
            .set('Authorization', `Bearer ${schoolAdminToken}`)
            .expect(200);

        expect(Array.isArray(response.body.data)).toBe(true);
        const student = response.body.data.find((s: any) => s.id === createdStudentId);
        expect(student).toBeDefined();
    });

    it('/students/:id (GET) - Get student details', async () => {
        const response = await request(app.getHttpServer())
            .get(`/students/${createdStudentId}`)
            .set('Authorization', `Bearer ${schoolAdminToken}`)
            .expect(200);

        expect(response.body.id).toBe(createdStudentId);
    });

    it('/students/:id (PATCH) - Update student', async () => {
        const response = await request(app.getHttpServer())
            .patch(`/students/${createdStudentId}`)
            .set('Authorization', `Bearer ${schoolAdminToken}`)
            .send({ firstName: 'UpdatedName' })
            .expect(200);

        expect(response.body.user.firstName).toBe('UpdatedName');
    });

    it('/students/:id (DELETE) - Delete student', async () => {
        await request(app.getHttpServer())
            .delete(`/students/${createdStudentId}`)
            .set('Authorization', `Bearer ${schoolAdminToken}`)
            .expect(200);

        createdStudentId = '';
    });
});
