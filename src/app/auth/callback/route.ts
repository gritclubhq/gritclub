import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { origin } = new URL(request.url)
  // With implicit flow, redirect to dashboard and let middleware handle auth
  return NextResponse.redirect(`${origin}/dashboard`)
}
