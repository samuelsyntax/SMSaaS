import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Create SuperAdmin user
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const superAdmin = await prisma.user.upsert({
        where: { email: 'superadmin@sms.com' },
        update: {},
        create: {
            email: 'superadmin@sms.com',
            password: hashedPassword,
            firstName: 'Super',
            lastName: 'Admin',
            role: Role.SUPER_ADMIN,
            isActive: true,
        },
    });

    console.log('✅ SuperAdmin created:', superAdmin.email);

    // Create a demo school
    const school = await prisma.school.upsert({
        where: { code: 'DEMO' },
        update: {},
        create: {
            name: 'Demo School',
            code: 'DEMO',
            address: '123 Education Street',
            city: 'Learning City',
            state: 'Knowledge State',
            country: 'US',
            phone: '+1-555-0100',
            email: 'info@demoschool.edu',
            isActive: true,
        },
    });

    console.log('✅ Demo school created:', school.name);

    // Create School Admin
    const schoolAdmin = await prisma.user.upsert({
        where: { email: 'admin@demoschool.edu' },
        update: {},
        create: {
            email: 'admin@demoschool.edu',
            password: hashedPassword,
            firstName: 'School',
            lastName: 'Admin',
            role: Role.SCHOOL_ADMIN,
            schoolId: school.id,
            isActive: true,
        },
    });

    console.log('✅ School admin created:', schoolAdmin.email);

    // Create Academic Year
    const academicYear = await prisma.academicYear.upsert({
        where: { schoolId_name: { schoolId: school.id, name: '2024-2025' } },
        update: {},
        create: {
            name: '2024-2025',
            startDate: new Date('2024-09-01'),
            endDate: new Date('2025-06-30'),
            isCurrent: true,
            schoolId: school.id,
        },
    });

    console.log('✅ Academic year created:', academicYear.name);

    // Create Classes
    const classes = await Promise.all([
        prisma.class.upsert({
            where: { schoolId_name: { schoolId: school.id, name: 'Grade 9A' } },
            update: {},
            create: { name: 'Grade 9A', grade: '9', section: 'A', capacity: 30, schoolId: school.id },
        }),
        prisma.class.upsert({
            where: { schoolId_name: { schoolId: school.id, name: 'Grade 9B' } },
            update: {},
            create: { name: 'Grade 9B', grade: '9', section: 'B', capacity: 30, schoolId: school.id },
        }),
        prisma.class.upsert({
            where: { schoolId_name: { schoolId: school.id, name: 'Grade 10A' } },
            update: {},
            create: { name: 'Grade 10A', grade: '10', section: 'A', capacity: 30, schoolId: school.id },
        }),
    ]);

    console.log('✅ Classes created:', classes.length);

    // Create Subjects
    const subjects = await Promise.all([
        prisma.subject.upsert({
            where: { schoolId_code: { schoolId: school.id, code: 'MATH101' } },
            update: {},
            create: { name: 'Mathematics', code: 'MATH101', creditHours: 4, schoolId: school.id },
        }),
        prisma.subject.upsert({
            where: { schoolId_code: { schoolId: school.id, code: 'ENG101' } },
            update: {},
            create: { name: 'English', code: 'ENG101', creditHours: 3, schoolId: school.id },
        }),
        prisma.subject.upsert({
            where: { schoolId_code: { schoolId: school.id, code: 'SCI101' } },
            update: {},
            create: { name: 'Science', code: 'SCI101', creditHours: 4, schoolId: school.id },
        }),
        prisma.subject.upsert({
            where: { schoolId_code: { schoolId: school.id, code: 'HIS101' } },
            update: {},
            create: { name: 'History', code: 'HIS101', creditHours: 2, schoolId: school.id },
        }),
    ]);

    console.log('✅ Subjects created:', subjects.length);

    // Create a demo teacher
    const teacherUser = await prisma.user.upsert({
        where: { email: 'teacher@demoschool.edu' },
        update: {},
        create: {
            email: 'teacher@demoschool.edu',
            password: hashedPassword,
            firstName: 'John',
            lastName: 'Teacher',
            role: Role.TEACHER,
            schoolId: school.id,
            isActive: true,
        },
    });

    const teacher = await prisma.teacher.upsert({
        where: { userId: teacherUser.id },
        update: {},
        create: {
            employeeId: 'TCH-2024-0001',
            userId: teacherUser.id,
            schoolId: school.id,
            qualification: 'M.Ed',
            specialization: 'Mathematics',
        },
    });

    console.log('✅ Demo teacher created:', teacherUser.email);

    // Create demo students
    for (let i = 1; i <= 5; i++) {
        const studentUser = await prisma.user.upsert({
            where: { email: `student${i}@demoschool.edu` },
            update: {},
            create: {
                email: `student${i}@demoschool.edu`,
                password: hashedPassword,
                firstName: `Student`,
                lastName: `${i}`,
                role: Role.STUDENT,
                schoolId: school.id,
                isActive: true,
            },
        });

        await prisma.student.upsert({
            where: { userId: studentUser.id },
            update: {},
            create: {
                studentId: `STU-2024-000${i}`,
                userId: studentUser.id,
                schoolId: school.id,
                currentClassId: classes[0].id,
            },
        });
    }

    console.log('✅ Demo students created: 5');

    // Create Fee Structure
    await prisma.feeStructure.upsert({
        where: { id: 'fee-tuition' },
        update: {},
        create: {
            id: 'fee-tuition',
            name: 'Tuition Fee',
            description: 'Annual tuition fee',
            amount: 5000,
            frequency: 'YEARLY',
            schoolId: school.id,
            academicYearId: academicYear.id,
        },
    });

    await prisma.feeStructure.upsert({
        where: { id: 'fee-lab' },
        update: {},
        create: {
            id: 'fee-lab',
            name: 'Lab Fee',
            description: 'Science lab usage fee',
            amount: 500,
            frequency: 'YEARLY',
            schoolId: school.id,
            academicYearId: academicYear.id,
        },
    });

    console.log('✅ Fee structures created');

    console.log('\n🎉 Database seeding completed!');
    console.log('\n📋 Login credentials:');
    console.log('  SuperAdmin: superadmin@sms.com / admin123');
    console.log('  SchoolAdmin: admin@demoschool.edu / admin123');
    console.log('  Teacher: teacher@demoschool.edu / admin123');
    console.log('  Student: student1@demoschool.edu / admin123');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
