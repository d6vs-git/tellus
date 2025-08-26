// app/embed/[code]/page.tsx

import { TestimonialEmbed } from './testimonial-embed';
import { PrismaClient } from '@prisma/client';
// Prisma singleton pattern for Next.js

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default async function EmbedPage({ params }: any) {
  try {
    const feedback = await prisma.feedback.findMany({
      where: {
        code: params.code,
        rating: {
          gte: 4 // Only show positive testimonials in embed
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10 // Limit to 10 most recent positive testimonials
    });

    const user = await prisma.user.findUnique({
      where: { code: params.code },
      select: { username: true }
    });

    return (
      <TestimonialEmbed 
        feedback={feedback.map(fb => ({
          ...fb,
          createdAt: fb.createdAt.toISOString(),
          updatedAt: fb.updatedAt.toISOString(),
        }))} 
        businessName={user?.username || 'This Business'} 
      />
    );
  } catch (error) {
    console.error('Failed to load testimonials:', error);
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-gray-800">Testimonials Loading...</h2>
        <p className="text-gray-600">Please wait while we fetch the latest testimonials.</p>
      </div>
    );
  }
}