import Head from 'next/head';
import { generateStructuredData, StructuredDataProps } from '@/lib/structured-data';

interface StructuredDataComponentProps {
  data: StructuredDataProps[];
}

export default function StructuredData({ data }: StructuredDataComponentProps) {
  return (
    <Head>
      {data.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: generateStructuredData(item)
          }}
        />
      ))}
    </Head>
  );
}
