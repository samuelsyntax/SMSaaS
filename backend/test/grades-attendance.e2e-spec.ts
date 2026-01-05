import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';

describe('Attendance, Exams & Grades (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let schoolAdminToken: string;
    let academicYearId: string;
    let createdClassId: string;
    let createdSubjectId: string;
    let createdStudentId: string;
    let createdEnrollmentId: string;
    let createdExamId: string;
    let createdGradeId: string;
    let createdAttendanceId: string;

    beforeAll(async () => {
        jest.setTimeout(60000); // 1 minute timeout
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

        // Setup: Create Class
        const classRes = await request(app.getHttpServer())
            .post('/classes')
            .set('Authorization', `Bearer ${schoolAdminToken}`)
            .send({ name: 'Exam Class', grade: '11', section: 'X', capacity: 20 });
        createdClassId = classRes.body.id;

        // Setup: Create Subject
        const subjectRes = await request(app.getHttpServer())
            .post('/subjects')
            .set('Authorization', `Bearer ${schoolAdminToken}`)
            .send({ name: 'Exam Subject', code: 'EXM101', creditHours: 3 });
        createdSubjectId = subjectRes.body.id;

        // Setup: Create Student
        const uniqueId = Date.now();
        const studentRes = await request(app.getHttpServer())
            .post('/students')
            .set('Authorization', `Bearer ${schoolAdminToken}`)
            .send({
                email: `examstudent${uniqueId}@school.com`,
                password: 'password123',
                firstName: 'Exam',
                lastName: 'Candidate',
                dateOfBirth: '2009-01-01',
                gender: 'MALE'
            });
        createdStudentId = studentRes.body.id;

        // Setup: Enroll Student
        const enrollRes = await request(app.getHttpServer())
            .post('/enrollments')
            .set('Authorization', `Bearer ${schoolAdminToken}`)
            .send({
                studentId: createdStudentId,
                classId: createdClassId,
                academicYearId: academicYearId
            });
        createdEnrollmentId = enrollRes.body.id;
    }, 60000);

    afterAll(async () => {
        // Cleanup
        const server = app.getHttpServer();
        const headers = { Authorization: `Bearer ${schoolAdminToken}` };

        if (createdGradeId) await request(server).delete(`/grades/${createdGradeId}`).set(headers);
        if (createdExamId) await request(server).delete(`/exams/${createdExamId}`).set(headers);
        if (createdAttendanceId) await request(server).delete(`/attendance/${createdAttendanceId}`).set(headers);
        if (createdEnrollmentId) await request(server).delete(`/enrollments/${createdEnrollmentId}`).set(headers);
        if (createdStudentId) await request(server).delete(`/students/${createdStudentId}`).set(headers);
        if (createdSubjectId) await request(server).delete(`/subjects/${createdSubjectId}`).set(headers);
        if (createdClassId) await request(server).delete(`/classes/${createdClassId}`).set(headers);

        await app.close();
    });

    // Attendance Tests
    it('/attendance (POST) - Mark Attendance', async () => {
        const response = await request(app.getHttpServer())
            .post('/attendance')
            .set('Authorization', `Bearer ${schoolAdminToken}`)
            .send({
                studentId: createdStudentId,
                classId: createdClassId,
                date: new Date().toISOString().split('T')[0],
                status: 'PRESENT'
            })
            .expect(201);

        createdAttendanceId = response.body.id;
        expect(createdAttendanceId).toBeDefined();
    });

    it('/attendance (GET) - Get Attendance', async () => {
        await request(app.getHttpServer())
            .get('/attendance')
            .query({ studentId: createdStudentId })
            .set('Authorization', `Bearer ${schoolAdminToken}`)
            .expect(200);
    });

    // Exam Tests
    it('/exams (POST) - Create Exam', async () => {
        const response = await request(app.getHttpServer())
            .post('/exams')
            .set('Authorization', `Bearer ${schoolAdminToken}`)
            .send({
                name: 'Final Exam',
                type: 'FINAL',
                totalMarks: 100,
                passingMarks: 40,
                subjectId: createdSubjectId,
                academicYearId: academicYearId
            })
            .expect(201);

        createdExamId = response.body.id;
        expect(createdExamId).toBeDefined();
    });

    // Grade Tests
    it('/grades (POST) - Add Grade', async () => {
        const response = await request(app.getHttpServer())
            .post('/grades')
            .set('Authorization', `Bearer ${schoolAdminToken}`)
            .send({
                studentId: createdStudentId,
                examId: createdExamId,
                subjectId: createdSubjectId,
                marksObtained: 85
            })
            .expect(201);

        createdGradeId = response.body.id;
        expect(createdGradeId).toBeDefined();
    });

    it('/grades (GET) - Verify Grade', async () => {
        const response = await request(app.getHttpServer())
            .get(`/grades/${createdGradeId}`)
            .set('Authorization', `Bearer ${schoolAdminToken}`)
            .expect(200);

        expect(response.body.marksObtained).toBe(85);
    });
});
