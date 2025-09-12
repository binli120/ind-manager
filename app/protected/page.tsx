import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function ProtectedPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-12 p-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">Protected Page</h1>
        <p className="text-muted-foreground">Welcome! You are successfully authenticated.</p>
        <div className="bg-muted p-4 rounded-lg">
          <h2 className="font-semibold mb-2">User Information:</h2>
          <p>
            <strong>Email:</strong> {data.user.email}
          </p>
          <p>
            <strong>User ID:</strong> {data.user.id}
          </p>
          <p>
            <strong>Created:</strong> {new Date(data.user.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  )
}
