"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
// AuthModal import removed as it's now in app/home/page.tsx
import { User, Settings, LogOut, Crown, LogIn } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import { useTheme } from "next-themes"

interface HeaderProps {
  isAdmin?: boolean
  onAdminLogout?: () => void
  // New props for auth state and actions
  isLoggedIn: boolean
  user: { name: string; email: string; isPremium: boolean } | null
  onSignInClick: () => void
  onSignUpClick: () => void
  onLogout: () => void
}

export function Header({
  isAdmin = false,
  onAdminLogout,
  isLoggedIn,
  user,
  onSignInClick,
  onSignUpClick,
  onLogout,
}: HeaderProps) {
  const { theme } = useTheme()
  const isDarkMode = theme === "dark"

  const handleLogout = () => {
    onLogout() // Use the passed onLogout prop
    if (isAdmin && onAdminLogout) {
      onAdminLogout()
    }
  }

  return (
    <>
      <header className="bg-transparent backdrop-blur-lg border-b border-white/10 sticky top-0 z-50 dark:bg-transparent dark:border-gray-700/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo - Only text logo */}
            <Link href="/" className="flex items-center gap-3">
              <img
                src={isDarkMode ? "/images/jocruit-logo-dark.png" : "/images/jocruit-logo-light.png"}
                alt="JoCruit AIX"
                className="h-8 w-auto"
              />
            </Link>

            {/* Auth Section */}
            <div className="flex items-center gap-4">
              <ThemeToggle />
              {!isLoggedIn ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90 text-white">Sign In / Sign Up</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuItem onClick={onSignInClick}>
                      <LogIn className="mr-2 h-4 w-4" />
                      <span>Sign In</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onSignUpClick}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Sign Up</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        <Crown className="mr-2 h-4 w-4" />
                        <span>Admin Login</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="/placeholder.svg?height=40&width=40" alt={user?.name} />
                        <AvatarFallback>{user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      {user?.isPremium && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                          <Crown className="w-2 h-2 text-white" />
                        </div>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                        {user?.isPremium && (
                          <div className="flex items-center gap-1 text-xs text-yellow-600">
                            <Crown className="w-3 h-3" />
                            Premium Member
                          </div>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </header>
      {/* AuthModal removed from here */}
    </>
  )
}
