import { getServerSession } from "next-auth/next"
import { PrismaClient } from "@prisma/client"
import { redirect } from 'next/navigation'
import { DashboardClient } from './dashboard-client'

const prisma = new PrismaClient()

export default async function HomePage() {
  const session = await getServerSession()
  
  if (!session) {
    redirect('/api/auth/signin')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user?.email! }
  })

  if (!user) {
    throw new Error("User not found")
  }

  const feedback = await prisma.feedback.findMany({
    where: { user: { id: user.id } }
  })

  const feedbackUrl = `${process.env.NEXTAUTH_URL}/${user.code}`

  return <DashboardClient feedbackUrl={feedbackUrl} feedback={feedback} userCode={user.code} />
}

