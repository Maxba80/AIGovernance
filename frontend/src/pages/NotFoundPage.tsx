import { Link } from 'react-router-dom';
import { Card, PageHeader } from '../components/ui/Card';

export function NotFoundPage() {
  return (
    <>
      <PageHeader title="Page not found" />
      <Card className="px-6 py-12 text-center">
        <p className="text-sm text-muted">This page does not exist.</p>
        <Link to="/" className="mt-3 inline-block text-sm font-medium text-accent-text hover:underline">
          Back to Overview
        </Link>
      </Card>
    </>
  );
}
