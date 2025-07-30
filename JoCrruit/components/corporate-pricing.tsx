import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"
import Link from "next/link"

const corporatePlans = [
  {
    name: "Starter",
    price: "$1.80",
    per: "per interview",
    interviews: "10 interviews/month",
    features: ["Basic interviews", "Standard reports", "Email support", "Basic analytics"],
    popular: false,
  },
  {
    name: "Growth",
    price: "$1.50",
    per: "per interview",
    interviews: "50 interviews/month",
    features: ["Custom branding", "Bulk upload", "Advanced analytics", "Priority support"],
    popular: true,
  },
  {
    name: "Pro",
    price: "$1.20",
    per: "per interview",
    interviews: "200 interviews/month",
    features: ["Custom question sets", "API integration", "White-label options", "Dedicated support"],
    popular: false,
  },
  {
    name: "Enterprise",
    price: "$1.00",
    per: "per interview",
    interviews: "1000+ interviews/month",
    features: ["Full analytics suite", "Admin/team features", "SLA guarantee", "Custom Integrations"],
    popular: false,
  },
]

export function CorporatePricing() {
  return (
    <section className="py-20 bg-gradient-to-b from-[#0A1930] to-[#1A2B40] text-white px-4">
      <div className="container mx-auto max-w-6xl text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">Organization & Enterprise Plans</h2>
        <p className="text-lg md:text-xl mb-12 opacity-90">
          Fair Pricing for Every Sector—Academia, Industry, and Enterprise. Scale up or down as needed with our flexible pricing model.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {corporatePlans.map((plan, index) => (
            <Card
              key={index}
              className={`relative p-6 text-center shadow-lg border ${
                plan.popular ? "border-blue-500" : "border-gray-700"
              } bg-gray-800/50 backdrop-blur-lg`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
                  Most Popular
                </div>
              )}
              <CardHeader className="p-0 mb-6">
                <CardTitle className="text-2xl font-bold text-white mb-2">{plan.name}</CardTitle>
                <div className="text-5xl font-extrabold text-blue-400 mb-1">{plan.price}</div>
                <p className="text-sm text-gray-300">{plan.per}</p>
                <p className="text-sm text-gray-400 mt-2">{plan.interviews}</p>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="space-y-3 text-left w-full mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-2 text-gray-200">
                      <Check className="w-5 h-5 text-green-400" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="#contact" passHref className="w-full">
                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white py-3 text-lg rounded-full shadow-lg transition-all duration-300"
                  >
                    Get Started
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
