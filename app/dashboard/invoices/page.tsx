import { fetchInvoicesPages } from '@/app/lib/data';
import { Metadata } from 'next';
import InvoicesClientPage from './InvoicesClientPage';

export const runtime = 'nodejs';

export const metadata: Metadata = {
    title: 'Invoices',
};

interface PageProps {
    searchParams?: {
        query?: string;
        page?: string;
    };
}

export default async function Page({ searchParams }: PageProps) {
    const query = searchParams?.query ?? '';
    const currentPage = Number(searchParams?.page ?? '1');

    const totalPages = await fetchInvoicesPages(query);

    return (
        <InvoicesClientPage
            query={query}
            currentPage={currentPage}
            totalPages={totalPages}
        />
    );
}
