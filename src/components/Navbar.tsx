"use client"

import Link from "next/link"
import Image from "next/image"
import { useSession, signIn, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Menu, X, LayoutDashboard, LogOut, Brain, MessageSquare } from "lucide-react"
import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import logo from "@/assets/logo.png"
import google from "@/assets/google.png"

export function Navbar() {
  const { data: session } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center">
            <Link
              href="/"
              className="text-2xl font-bold text-foreground hover:text-primary transition-all duration-300 hover:scale-105"
            >
              <div className="flex items-center justify-center gap-3">
                <div className="relative p-1 rounded-full bg-gradient-to-r from-primary to-primary/60 shadow-lg hover:shadow-xl transition-all duration-300">
                  <Image
                    src={logo || "/placeholder.svg"}
                    alt="Logo"
                    width={48}
                    height={48}
                    className="rounded-full bg-background p-1"
                  />
                </div>
                <div className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">Tellus</div>
              </div>
            </Link>
          </div>

          

          <div className="hidden md:block">
            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-12 w-12 rounded-full hover:scale-105 transition-transform"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={session.user?.image || ""} alt={session.user?.name || ""} />
                      <AvatarFallback>{session.user?.name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{session.user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{session.user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/home" className="flex items-center">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => signIn("google")} size="lg" className="shadow-lg">
                <div className="flex items-center justify-center gap-3">
                  <Image
                    src={google || "/placeholder.svg"}
                    alt="Google"
                    width={20}
                    height={20}
                    className="rounded-full"
                  />
                  <div>Sign in with Google</div>
                </div>
              </Button>
            )}
          </div>

          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-foreground hover:text-primary"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-xl border-t border-border/50 shadow-xl">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {session && (
              <Link
                href="/home"
                className="text-muted-foreground hover:text-primary block px-3 py-2 rounded-lg text-base font-medium transition-all duration-200 hover:bg-accent/50"
              >
                <LayoutDashboard className="w-4 h-4 mr-2 inline" />
                Dashboard
              </Link>
            )}
          </div>
          {session ? (
            <div className="pt-4 pb-3 border-t border-border/50">
              <div className="flex items-center px-5">
                <div className="flex-shrink-0">
                  <Avatar>
                    <AvatarImage src={session.user?.image || ""} alt={session.user?.name || ""} />
                    <AvatarFallback>{session.user?.name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-foreground">{session.user?.name}</div>
                  <div className="text-sm font-medium text-muted-foreground">{session.user?.email}</div>
                </div>
              </div>
              <div className="mt-3 px-2">
                <Button onClick={() => signOut()} className="w-full justify-start" variant="ghost">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4">
              <Button onClick={() => signIn("google")} className="w-full" >
                <div className="flex items-center justify-center gap-3">
                  <Image
                    src={google || "/placeholder.svg"}
                    alt="Google"
                    width={20}
                    height={20}
                    className="rounded-full"
                  />
                  <div>Sign in with Google</div>
                </div>
              </Button>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
