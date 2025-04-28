import bcrypt from 'bcryptjs';
import postgres from 'postgres';
import { invoices, customers, revenue, users } from '../lib/placeholder-data';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// 공통으로 사용할 확장 및 테이블 생성 함수
async function setupDatabase() {
    // uuid-ossp 확장을 한 번만 생성
    await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

    // 모든 테이블 생성을 여기서 처리
    await sql`
        CREATE TABLE IF NOT EXISTS users (
                                             id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL
            );
    `;

    await sql`
    CREATE TABLE IF NOT EXISTS customers (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      image_url VARCHAR(255) NOT NULL
    );
  `;

    await sql`
    CREATE TABLE IF NOT EXISTS invoices (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      customer_id UUID NOT NULL,
      amount INT NOT NULL,
      status VARCHAR(255) NOT NULL,
      date DATE NOT NULL
    );
  `;

    await sql`
    CREATE TABLE IF NOT EXISTS revenue (
      month VARCHAR(4) NOT NULL UNIQUE,
      revenue INT NOT NULL
    );
  `;
}

// 테이블 생성 코드 제거 후 데이터 삽입만 처리하도록 수정
async function seedUsers() {
    const insertedUsers = await Promise.all(
        users.map(async (user) => {
            const hashedPassword = await bcrypt.hash(user.password, 10);
            return sql`
        INSERT INTO users (id, name, email, password)
        VALUES (${user.id}, ${user.name}, ${user.email}, ${hashedPassword})
        ON CONFLICT (id) DO NOTHING;
      `;
        }),
    );

    return insertedUsers;
}

async function seedInvoices() {
    const insertedInvoices = await Promise.all(
        invoices.map(
            (invoice) => sql`
                INSERT INTO invoices (customer_id, amount, status, date)
                VALUES (${invoice.customer_id}, ${invoice.amount}, ${invoice.status}, ${invoice.date})
                    ON CONFLICT (id) DO NOTHING;
            `,
        ),
    );

    return insertedInvoices;
}

async function seedCustomers() {
    const insertedCustomers = await Promise.all(
        customers.map(
            (customer) => sql`
                INSERT INTO customers (id, name, email, image_url)
                VALUES (${customer.id}, ${customer.name}, ${customer.email}, ${customer.image_url})
                    ON CONFLICT (id) DO NOTHING;
            `,
        ),
    );

    return insertedCustomers;
}

async function seedRevenue() {
    const insertedRevenue = await Promise.all(
        revenue.map(
            (rev) => sql`
        INSERT INTO revenue (month, revenue)
        VALUES (${rev.month}, ${rev.revenue})
        ON CONFLICT (month) DO NOTHING;
      `,
        ),
    );

    return insertedRevenue;
}

export async function GET() {
    try {
        // 먼저 데이터베이스 설정 (확장 및 테이블 생성)
        await setupDatabase();

        // 그 다음 데이터 삽입
        await Promise.all([
            seedUsers(),
            seedCustomers(),
            seedInvoices(),
            seedRevenue(),
        ]);

        return Response.json({message: 'Database seeded successfully'});
    } catch (error) {
        console.error('Seeding error:', error);
        return Response.json({error}, {status: 500});
    }
}