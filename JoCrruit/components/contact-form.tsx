"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Send } from "lucide-react"

export function ContactForm() {
  return (
    <section id="contact" className="py-20 bg-gradient-to-b from-[#1A2B40] to-[#0A1930] text-white px-4">
      <div className="container mx-auto max-w-4xl text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">Get in Touch</h2>
        <p className="text-lg md:text-xl mb-12 opacity-90">
          Ready to transform your hiring process? Let's discuss how JoCruit AI.X can help your organization.
        </p>
        <Card className="p-8 shadow-lg border border-gray-700 bg-gray-800/50 backdrop-blur-lg text-left">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="text-2xl font-bold text-white mb-2">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                type="text"
                placeholder="Your Name"
                className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500"
              />
              <Input
                type="email"
                placeholder="Your Email"
                className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500"
              />
              <Input
                type="text"
                placeholder="Company (Optional)"
                className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500"
              />
              <Select>
                <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500">
                  <SelectValue placeholder="Interested Plan (Optional)" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="growth">Growth</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Your Message."
                rows={5}
                className="md:col-span-2 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500"
              />
              <Button
                type="submit"
                size="lg"
                className="md:col-span-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white py-3 text-lg rounded-full shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                Send Message
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
