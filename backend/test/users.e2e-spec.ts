import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Role } from '../src/common/types';

describe('Users (e2e)', () => {
    let app: INestApplication;
    let superAdminToken: string;
    let createdUserId: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe());
        await app.init();

        // Login as Super Admin to get token
        const loginRes = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'superadmin@sms.com', password: 'admin123' });
        superAdminToken = loginRes.body.accessToken;
    });

    afterAll(async () => {
        // Cleanup: Delete created user
        if (createdUserId) {
            await request(app.getHttpServer())
                .delete(`/users/${createdUserId}`)
                .set('Authorization', `Bearer ${superAdminToken}`);
        }
        await app.close();
    });

    it('/users (POST) - Create a new School Admin', async () => {
        const newUser = {
            email: 'newadmin@school.com',
            password: 'password123',
            firstName: 'New',
            lastName: 'Admin',
            role: Role.SCHOOL_ADMIN,
        };

        const response = await request(app.getHttpServer())
            .post('/users')
            .set('Authorization', `Bearer ${superAdminToken}`)
            .send(newUser)
            .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.email).toBe(newUser.email);
        createdUserId = response.body.id;
    });

    it('/users/:id (GET) - Get details of created user', async () => {
        const response = await request(app.getHttpServer())
            .get(`/users/${createdUserId}`)
            .set('Authorization', `Bearer ${superAdminToken}`)
            .expect(200);

        expect(response.body.email).toBe('newadmin@school.com');
    });

    it('/users/:id (PATCH) - Update user details', async () => {
        const response = await request(app.getHttpServer())
            .patch(`/users/${createdUserId}`)
            .set('Authorization', `Bearer ${superAdminToken}`)
            .send({ firstName: 'Updated' })
            .expect(200);

        expect(response.body.firstName).toBe('Updated');
    });

    it('/users/:id (DELETE) - Delete user', async () => {
        await request(app.getHttpServer())
            .delete(`/users/${createdUserId}`)
            .set('Authorization', `Bearer ${superAdminToken}`)
            .expect(200);

        // Build cleanup check
        createdUserId = '';
    });
});
