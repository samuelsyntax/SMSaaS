import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Teachers (e2e)', () => {
    let app: INestApplication;
    let schoolAdminToken: string;
    let createdTeacherId: string;

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
        if (createdTeacherId) {
            await request(app.getHttpServer())
                .delete(`/teachers/${createdTeacherId}`)
                .set('Authorization', `Bearer ${schoolAdminToken}`);
        }
        await app.close();
    });

    it('/teachers (POST) - Create a new Teacher', async () => {
        const uniqueId = Date.now();
        const newTeacher = {
            email: `testteacher${uniqueId}@school.com`,
            password: 'password123',
            firstName: 'Test',
            lastName: 'Teacher',
            qualification: 'M.Ed',
            specialization: 'Mathematics',
        };

        const response = await request(app.getHttpServer())
            .post('/teachers')
            .set('Authorization', `Bearer ${schoolAdminToken}`)
            .send(newTeacher)
            .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.user.email).toBe(newTeacher.email);
        createdTeacherId = response.body.id;
    });

    it('/teachers (GET) - List teachers', async () => {
        const response = await request(app.getHttpServer())
            .get('/teachers')
            .set('Authorization', `Bearer ${schoolAdminToken}`)
            .expect(200);

        expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('/teachers/:id (GET) - Get teacher details', async () => {
        const response = await request(app.getHttpServer())
            .get(`/teachers/${createdTeacherId}`)
            .set('Authorization', `Bearer ${schoolAdminToken}`)
            .expect(200);

        expect(response.body.id).toBe(createdTeacherId);
    });

    it('/teachers/:id (PATCH) - Update teacher', async () => {
        const response = await request(app.getHttpServer())
            .patch(`/teachers/${createdTeacherId}`)
            .set('Authorization', `Bearer ${schoolAdminToken}`)
            .send({ firstName: 'UpdatedTeach' })
            .expect(200);

        expect(response.body.user.firstName).toBe('UpdatedTeach');
    });

    it('/teachers/:id (DELETE) - Delete teacher', async () => {
        await request(app.getHttpServer())
            .delete(`/teachers/${createdTeacherId}`)
            .set('Authorization', `Bearer ${schoolAdminToken}`)
            .expect(200);

        createdTeacherId = '';
    });
});
