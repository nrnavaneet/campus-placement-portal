import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ 
    message: 'Clear localStorage on client side',
    instructions: 'Call localStorage.clear() in browser console and refresh'
  })
}