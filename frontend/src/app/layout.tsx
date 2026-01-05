import { Metadata } from 'next';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';

export const metadata: Metadata = {
    title: 'School Management System',
    description: 'Multi-tenant School Management System',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Trigger rebuild to fix context
    return (
        <html lang="en">
            <body>
                <QueryProvider>
                    <ThemeProvider>{children}</ThemeProvider>
                </QueryProvider>
            </body>
        </html>
    );
}
