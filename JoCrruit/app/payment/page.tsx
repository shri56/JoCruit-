"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreditCard, QrCode, Wallet, ArrowLeft, Check } from "lucide-react"
import { Header } from "@/components/header"
import { useTheme } from "next-themes"
import Link from "next/link"

export default function PaymentPage() {
  const [showQr, setShowQr] = useState(false)
  const { theme } = useTheme()
  const isDarkMode = theme === "dark"

  const handlePayment = (method: string) => {
    // PAYMENT INTEGRATION DISABLED FOR NOW
    alert(`Payment integration is currently disabled. This would normally process ${method} payment.`)
    
    // COMMENTED OUT - Original payment logic
    // alert(`Simulating payment with ${method}. In a real app, this would integrate with a payment gateway.`)
    // In a real application, you would integrate with a payment gateway here.
    // For example, Razorpay, Stripe, PayPal SDKs.
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <img
            src={isDarkMode ? "/images/jocruit-logo-dark.png" : "/images/jocruit-logo-light.png"}
            alt="JoCruit AIX"
            className="h-8 w-auto mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Complete Your Purchase</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Unlock unlimited interviews with JoCruit AIX Premium!
          </p>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Choose Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="card" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="card" className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> Card
                </TabsTrigger>
                <TabsTrigger value="upi" className="flex items-center gap-2">
                  <QrCode className="w-4 h-4" /> UPI
                </TabsTrigger>
                <TabsTrigger value="other" className="flex items-center gap-2">
                  <Wallet className="w-4 h-4" /> Other
                </TabsTrigger>
              </TabsList>

              <TabsContent value="card" className="space-y-4 mt-6">
                <h3 className="font-semibold text-lg">Credit / Debit Card</h3>
                <div className="space-y-2">
                  <Label htmlFor="card-number">Card Number</Label>
                  <Input id="card-number" placeholder="XXXX XXXX XXXX XXXX" type="text" maxLength={19} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry-date">Expiry Date</Label>
                    <Input id="expiry-date" placeholder="MM/YY" type="text" maxLength={5} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input id="cvv" placeholder="XXX" type="text" maxLength={4} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="card-name">Name on Card</Label>
                  <Input id="card-name" placeholder="John Doe" type="text" />
                </div>
                <Button
                  onClick={() => handlePayment("Credit/Debit Card")}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  Pay $9.99
                </Button>
              </TabsContent>

              <TabsContent value="upi" className="space-y-4 mt-6">
                <h3 className="font-semibold text-lg">UPI Payment</h3>
                <Button onClick={() => setShowQr(!showQr)} className="w-full bg-blue-600 hover:bg-blue-700">
                  {showQr ? "Hide QR Code" : "Scan QR for UPI"}
                </Button>

                {showQr && (
                  <div className="flex flex-col items-center justify-center p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                    <img
                      src="/placeholder.svg?height=200&width=200"
                      alt="Blurred QR Code"
                      className="w-48 h-48 object-contain filter blur-sm mb-4"
                    />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Scan this QR code with your UPI app (GPay, PhonePe, Paytm, etc.)
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">Amount: $9.99</p>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" onClick={() => handlePayment("GPay")}>
                        <img src="/placeholder.svg?height=20&width=20" alt="GPay" className="w-5 h-5 mr-2" />
                        GPay
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handlePayment("PhonePe")}>
                        <img src="/placeholder.svg?height=20&width=20" alt="PhonePe" className="w-5 h-5 mr-2" />
                        PhonePe
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handlePayment("Paytm")}>
                        <img src="/placeholder.svg?height=20&width=20" alt="Paytm" className="w-5 h-5 mr-2" />
                        Paytm
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="other" className="space-y-4 mt-6">
                <h3 className="font-semibold text-lg">Other Payment Methods</h3>
                <Button onClick={() => handlePayment("Razorpay")} className="w-full bg-purple-600 hover:bg-purple-700">
                  <Check className="w-4 h-4 mr-2" /> Pay with Razorpay
                </Button>
                <Button onClick={() => handlePayment("PayPal")} className="w-full bg-blue-800 hover:bg-blue-900">
                  <Check className="w-4 h-4 mr-2" /> Pay with PayPal
                </Button>
                <p className="text-sm text-gray-600 dark:text-gray-400">More payment options coming soon!</p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Link href="/" passHref>
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
