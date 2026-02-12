// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
"use client"

import type React from "react"

import { APP_BUILD_NUMBER, APP_NAME, COMPANY_CONTACT_EMAIL, COMPANY_NAME } from "@/lib/app-info"
import { authServices } from "@/lib/auth/auth-services"
import { useAsyncTask } from "@/hooks/useAsyncTask"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"
import { LogIn, UserPlus } from "lucide-react"
import { useRouter } from "next/navigation"

interface LoginDialogProps {
  children?: React.ReactNode
}

export function LoginDialog({ children }: LoginDialogProps) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("login")
  const loginTask = useAsyncTask(
    async ({ nextEmail, nextPassword }: { nextEmail: string; nextPassword: string }) => {
      const { error } = await authServices.signIn(nextEmail, nextPassword)
      if (error) throw error
    },
    undefined,
  )
  const signUpTask = useAsyncTask(
    async ({
      nextEmail,
      nextPassword,
      redirectTo,
    }: {
      nextEmail: string
      nextPassword: string
      redirectTo: string
    }) => {
      const { error } = await authServices.signUp(nextEmail, nextPassword, undefined, {
        emailRedirectTo: redirectTo,
      })
      if (error) throw error
    },
    undefined,
  )
  const activeError = activeTab === "login" ? loginTask.error : signUpTask.error
  const isSubmitting = loginTask.isLoading || signUpTask.isLoading

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setInfoMessage(null)
    signUpTask.reset()
    const { error } = await loginTask.run({ nextEmail: email, nextPassword: password })
    if (!error) {
      setIsOpen(false)
      // Refresh the page to update auth state
      router.refresh()
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setInfoMessage(null)
    loginTask.reset()

    if (password !== repeatPassword) {
      signUpTask.setError("Passwords do not match")
      return
    }

    const { error } = await signUpTask.run({
      nextEmail: email,
      nextPassword: password,
      redirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin,
    })
    if (!error) {
      setInfoMessage("Check your email to confirm your account!")
      setActiveTab("login")
    }
  }

  const resetForm = () => {
    setEmail("")
    setPassword("")
    setRepeatPassword("")
    setInfoMessage(null)
    loginTask.reset()
    signUpTask.reset()
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) resetForm()
      }}
    >
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline">
            <LogIn className="w-4 h-4 mr-2" />
            Login
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{APP_NAME}</DialogTitle>
          <DialogDescription>
            Build {APP_BUILD_NUMBER}. Sign in to your account or create a new one to get started.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(nextValue) => {
            setActiveTab(nextValue)
            setInfoMessage(null)
            loginTask.reset()
            signUpTask.reset()
          }}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {activeError && <p className="text-sm text-red-500">{activeError}</p>}
              {infoMessage && <p className="text-sm text-emerald-600">{infoMessage}</p>}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="repeat-password">Repeat Password</Label>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                />
              </div>
              {activeError && <p className="text-sm text-red-500">{activeError}</p>}
              {infoMessage && <p className="text-sm text-emerald-600">{infoMessage}</p>}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                <UserPlus className="w-4 h-4 mr-2" />
                {isSubmitting ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
        <div className="mt-2 space-y-1 text-center text-xs text-muted-foreground">
          <p>{COMPANY_NAME}</p>
          <p>Copyright @ {COMPANY_NAME}</p>
          <p>
            Contact:{" "}
            <a href={`mailto:${COMPANY_CONTACT_EMAIL}`} className="underline underline-offset-2">
              {COMPANY_CONTACT_EMAIL}
            </a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
