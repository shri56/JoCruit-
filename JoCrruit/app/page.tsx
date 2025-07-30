"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Mic, BarChart2, Lightbulb, Check, MessageCircle, BookOpen, Zap, Target, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { Header } from "@/components/header"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { CorporatePricing } from "@/components/corporate-pricing"
import { ContactForm } from "@/components/contact-form"

// Placeholder for team member images
const teamMembers = [
  {
    name: "Katya Samson",
    role: "Dentist",
    avatar: "/images/testimonial-katya.png",
    quote: "JoCruit AIX truly challenged me and helped me secure a position I love!",
  },
  {
    name: "Anonymous",
    role: "Analyst",
    avatar: "/images/testimonial-anonymous.png",
    quote: "I was incredibly anxious about my interview, but practicing with JoCruit AIX made all the difference!",
  },
  {
    name: "Jim Paros",
    role: "Analyst",
    avatar: "/images/testimonial-jim.png",
    quote: "Using JoCruit AIX was fantastic. It significantly improved my interview skills!",
  },
  {
    name: "Alison",
    role: "Accountant",
    avatar: "/images/testimonial-alison.png",
    quote: "The questions were so insightful and clever! It genuinely helped me prepare.",
  },
]

export default function LandingPage() {
  const { theme } = useTheme()
  const isDarkMode = theme === "dark"

  const features = [
    {
      icon: Lightbulb,
      title: "Tailored to Your Profile and Role",
      description:
        "Seamlessly import job descriptions from any platform and upload your resume. Our AI interviewer crafts personalized questions, making your practice sessions incredibly realistic.",
      subFeatures: ["Customized to your CV", "Adapted to your job listing"],
      image: "/images/job-listing-mockup.png",
      imageAlt: "Job listing imported",
    },
    {
      icon: BarChart2,
      title: "Receive Actionable, Constructive Feedback",
      description:
        "We provide precise, actionable feedback to refine your interview technique. Progress through various difficulty levels, from beginner to advanced, to perfect your responses.",
      subFeatures: ["Direct, clear feedback", "Multiple difficulty levels"],
      image: "/images/difficulty-settings-mockup.png",
      imageAlt: "Realistic technical questions, Set your difficulty",
    },
    {
      icon: Mic,
      title: "Immersive Voice Interaction",
      description: "Experience a truly realistic interview simulation with our advanced voice chat feature.",
      image: "/images/voice-chat-mockup.png",
      imageAlt: "Voice chat interface",
    },
    {
      icon: Target,
      title: "Identify Gaps in Your Resume",
      description:
        "Our AI interviewer will challenge you on everything from job-specific technical concepts to details on your resume, helping you uncover areas for improvement.",
      image: "/images/cv-holes-mockup.png",
      imageAlt: "Resume with highlighted sections",
    },
    {
      icon: TrendingUp,
      title: "Refine Your Interview Technique",
      description: "Advance from easy to challenging modes, mastering every aspect of your interview performance.",
      subFeatures: ["Continuous improvement", "Conquer all skill levels"],
      image: "/placeholder.svg?height=200&width=300",
      imageAlt: "Progress chart",
    },
  ]

  const faqs = [
    {
      question: "What is JoCruit AIX?",
      answer:
        "JoCruit AIX is an advanced AI-powered platform designed to help you excel in your job interviews. It provides personalized practice, real-time feedback, and detailed analytics to enhance your communication and technical skills.",
    },
    {
      question: "How does JoCruit AIX personalize interviews to my job?",
      answer:
        "You can easily import job descriptions from popular job boards. Our AI then analyzes the requirements to generate interview questions specifically tailored to that role, ensuring highly relevant practice.",
    },
    {
      question: "How does JoCruit AIX personalize interviews to my CV?",
      answer:
        "By uploading your CV (resume), our AI analyzes your professional background and skills. It then generates questions that challenge you based on your experience, simulating a real-world interview scenario.",
    },
    {
      question: "What does the unlimited plan offer?",
      answer:
        "The unlimited plan grants you full access to all JoCruit AIX features, including unlimited practice interviews, comprehensive feedback, and the ability to progress through all difficulty levels without any limitations.",
    },
    {
      question: "What payment methods are accepted?",
      answer:
        "Payments for the unlimited plan are securely processed via Stripe, supporting various options including major credit and debit cards. We are continuously exploring additional payment methods.",
    },
    {
      question: "How can I cancel my subscription?",
      answer:
        "You can conveniently manage and cancel your unlimited plan subscription at any time directly from your account settings within the JoCruit AIX platform.",
    },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* Hero Section */}
      <section
        className="relative h-screen flex items-center justify-center text-center overflow-hidden px-4 py-20 md:py-0"
        style={{
          backgroundImage: `linear-gradient(to bottom, hsl(220 10% 8%), hsl(220 10% 15%))`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Parallax background elements */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(/images/subtle-dark-dots.png)`,
            backgroundSize: "20px 20px",
            backgroundPosition: "center",
            backgroundAttachment: "fixed",
            opacity: 0.05,
          }}
        ></div>
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(/placeholder.svg?height=1000&width=1000&query=abstract geometric pattern)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed",
            opacity: 0.02,
            transform: "scale(1.1)",
          }}
        ></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-center max-w-6xl mx-auto gap-12">
          <div className="text-white text-left md:w-1/2">
            <h2 className="text-lg font-semibold mb-2 opacity-80">AI-Powered Interview Preparation</h2>
            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 drop-shadow-lg">
              Master Your Next Interview!
            </h1>
            <p className="text-lg md:text-xl mb-8 opacity-90">
              Engage with our intelligent AI interview coach in real-time practice sessions and receive instant,
              actionable feedback to refine your skills.
            </p>
            <Link href="/home" passHref>
              <Button
                size="lg"
                className="bg-orange-500/20 backdrop-blur-md border border-orange-400/50 text-white py-3 px-8 text-lg rounded-full shadow-lg transition-all duration-300 hover:scale-105 hover:bg-orange-500/30"
              >
                Start My Practice
              </Button>
            </Link>
            <div className="mt-8 flex flex-wrap gap-4 text-sm font-medium">
              <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <Check className="w-4 h-4 text-green-400" /> Communication Skills
              </span>
              <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <Check className="w-4 h-4 text-green-400" /> Resume Analysis
              </span>
              <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <Check className="w-4 h-4 text-green-400" /> Job Role Customization
              </span>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center items-center mt-12 md:mt-0">
            <img
              src="/images/hero-phone-mockup.png"
              alt="Phone mockup showing AI interview app"
              className="w-full max-w-sm md:max-w-md lg:max-w-lg h-auto object-contain shadow-2xl rounded-3xl"
            />
          </div>
        </div>
      </section>

      {/* Discover the Power of AI Interviewing */}
      <section className="py-20 bg-gradient-to-b from-secondary to-background dark:from-secondary dark:to-background px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-8">
            Experience the Most Advanced AI Interviewer.
          </h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <div className="md:w-1/2 flex justify-center">
              <img
                src="/images/chat-bubble-mockup.png"
                alt="AI chat bubble with user response"
                className="w-full max-w-xs object-contain rounded-lg shadow-xl"
              />
            </div>
            <div className="md:w-1/2 text-left space-y-4">
              <p className="text-lg text-gray-700 dark:text-gray-300">
                "My decision to leave Citi Bank was driven by a desire for new challenges and growth opportunities…"
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Check className="w-4 h-4 text-green-500" /> Resume content analyzed
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Check className="w-4 h-4 text-green-500" /> Experience-based questions
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      {features.map((feature, index) => (
        <section
          key={index}
          className={`py-20 px-4 ${index % 2 === 0 ? "bg-background dark:bg-background" : "bg-secondary dark:bg-secondary"}`}
        >
          <div className="container mx-auto max-w-6xl">
            <div
              className={`flex flex-col md:flex-row items-center gap-12 ${index % 2 !== 0 ? "md:flex-row-reverse" : ""}`}
            >
              <div className="md:w-1/2 text-center md:text-left">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">{feature.title}</h2>
                <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">{feature.description}</p>
                {feature.subFeatures && (
                  <div className="space-y-2 mb-6">
                    {feature.subFeatures.map((sub, subIndex) => (
                      <div key={subIndex} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <Check className="w-5 h-5 text-primary" />
                        <span className="font-medium">{sub}</span>
                      </div>
                    ))}
                  </div>
                )}
                {index === 0 && (
                  <Link href="/home" passHref>
                    <Button
                      size="lg"
                      className="bg-primary hover:bg-primary/90 text-white py-3 px-8 text-lg rounded-full shadow-lg"
                    >
                      Begin Your Interview Now
                    </Button>
                  </Link>
                )}
                {index === 1 && (
                  <Link href="#pricing" passHref>
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-primary text-primary hover:bg-primary/10 py-3 px-8 text-lg rounded-full bg-transparent"
                    >
                      Explore Pricing Plans
                    </Button>
                  </Link>
                )}
              </div>
              <div className="md:w-1/2 flex justify-center">
                <img
                  src={feature.image || "/placeholder.svg"}
                  alt={feature.imageAlt}
                  className="w-full max-w-md object-contain rounded-lg shadow-xl transition-transform duration-300 hover:scale-105"
                />
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* Achieve Your Dream Job! Section */}
      <section className="py-20 bg-gradient-to-b from-background to-secondary dark:from-background dark:to-secondary px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Secure the Job You Deserve!
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-12">
            Practice leads to perfection. Elevate your skills with our AI-powered interview coach, gaining valuable
            feedback on weaknesses and honing your strengths.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div className="flex flex-col items-center text-center p-6 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 transition-transform duration-300 hover:scale-[1.02] hover:shadow-2xl">
              <Mic className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Authentic Voice Chat</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Our lifelike voice interaction creates a truly immersive interview experience.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 transition-transform duration-300 hover:scale-[1.02] hover:shadow-2xl">
              <Zap className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Intelligent Interviewer</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Our AI interviewer will probe your knowledge on job-specific technicalities and resume details.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 transition-transform duration-300 hover:scale-[1.02] hover:shadow-2xl">
              <MessageCircle className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Actionable Feedback</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Receive honest, constructive feedback from our intelligent interview model.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 transition-transform duration-300 hover:scale-[1.02] hover:shadow-2xl">
              <BookOpen className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Progressive Skill Mastery</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Work your way from foundational to advanced levels, perfecting your interview technique.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-sm font-medium">
            <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 text-white">
              <Check className="w-4 h-4 text-green-400" /> Communication
            </span>
            <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 text-white">
              <Check className="w-4 h-4 text-green-400" /> Cultural Fit
            </span>
            <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 text-white">
              <Check className="w-4 h-4 text-green-400" /> Problem Solving
            </span>
            <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 text-white">
              <Check className="w-4 h-4 text-green-400" /> Technical Acumen
            </span>
          </div>
        </div>
      </section>

      {/* Success Stories Section */}
      <section className="py-20 bg-background dark:bg-background px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">Success Stories</h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-12">
            Will you be the next success story? Prepare to stand out!
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <Card
                key={index}
                className="p-6 text-center shadow-lg
                         bg-white/10 backdrop-blur-lg border border-white/20
                         dark:bg-gray-800/10 dark:border-gray-700/20
                         transition-transform duration-300 hover:scale-[1.02] hover:shadow-2xl"
              >
                <CardContent className="flex flex-col items-center p-0">
                  <img
                    src={member.avatar || "/placeholder.svg"}
                    alt={member.name}
                    className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-primary-200 dark:border-primary-700"
                  />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{member.name}</h3>
                  <p className="text-primary text-sm font-medium mb-4">{member.role}</p>
                  <p className="text-gray-600 dark:text-gray-400 italic">"{member.quote}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Individual User Pricing Section */}
      <section id="pricing" className="py-20 bg-secondary dark:bg-secondary px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Pricing for Individual Users
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-12">
            Start with a free trial, then unlock unlimited interview practice.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Free Plan Card */}
            <Card className="p-8 shadow-lg bg-white/10 backdrop-blur-lg border border-white/20 dark:bg-gray-800/10 dark:border-gray-700/20 transition-transform duration-300 hover:scale-[1.02] hover:shadow-2xl">
              <CardContent className="p-0 flex flex-col items-center">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Start for Free</h3>
                <div className="text-5xl font-extrabold text-primary mb-2">$0</div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Limited practice time</p>
                <ul className="space-y-3 text-left w-full">
                  <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <Check className="w-5 h-5 text-green-500" /> Personalized CV analysis
                  </li>
                  <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <Check className="w-5 h-5 text-green-500" /> Automated job listing import
                  </li>
                  <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <Check className="w-5 h-5 text-green-500" /> Tailored interview questions
                  </li>
                </ul>
                <Link href="/home" passHref className="w-full mt-8">
                  <Button
                    size="lg"
                    className="w-full bg-primary hover:bg-primary/90 text-white py-3 text-lg rounded-full"
                  >
                    Begin Free Trial
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Unlimited Plan Card */}
            <Card className="p-8 shadow-lg bg-white/10 backdrop-blur-lg border border-white/20 dark:bg-gray-800/10 dark:border-gray-700/20 transition-transform duration-300 hover:scale-[1.02] hover:shadow-2xl">
              <CardContent className="p-0 flex flex-col items-center">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Unlimited Access</h3>
                <div className="text-5xl font-extrabold text-primary mb-2">$9.99</div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">per week</p>
                <ul className="space-y-3 text-left w-full">
                  <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <Check className="w-5 h-5 text-green-500" /> Unlimited interview sessions
                  </li>
                  <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <Check className="w-5 h-5 text-green-500" /> Comprehensive feedback reports
                  </li>
                  <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <Check className="w-5 h-5 text-green-500" /> Full progression through all levels
                  </li>
                  <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <Check className="w-5 h-5 text-green-500" /> Flexible cancellation anytime
                  </li>
                  <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <Check className="w-5 h-5 text-green-500" /> Secure payments via Stripe
                  </li>
                </ul>
                <Link href="/payment" passHref className="w-full mt-8">
                  <Button
                    size="lg"
                    className="w-full bg-primary hover:bg-primary/90 text-white py-3 text-lg rounded-full"
                  >
                    Unlock Unlimited Interviews
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Corporate Pricing Section */}
      <CorporatePricing />

      {/* FAQ Section */}
      <section className="py-20 bg-background dark:bg-background px-4">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-lg font-semibold text-gray-900 dark:text-white hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-700 dark:text-gray-300">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-primary dark:bg-primary text-white text-center px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Achieve Your Dream Career</h2>
          <p className="text-lg md:text-xl mb-10 opacity-90">
            Start preparing for your next interview today! It's free to get started.
          </p>
          <Link href="/home" passHref>
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-gray-100 py-3 px-8 text-lg rounded-full shadow-lg transition-all duration-300 hover:scale-105"
            >
              Start Your Journey Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Contact Form Section */}
      <ContactForm />

      {/* Footer */}
      <footer className="py-8 text-center text-gray-600 dark:text-gray-400 bg-background dark:bg-background border-t border-gray-200 dark:border-gray-700 px-4">
        <div className="container mx-auto">
          <p className="mb-4">&copy; {new Date().getFullYear()} JoCruit AIX. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-4 text-sm">
            <Link href="/" className="hover:text-primary transition-colors">
              Homepage
            </Link>
            <Link href="#pricing" className="hover:text-primary transition-colors">
              Pricing
            </Link>
            <Button
              variant="link"
              onClick={() => {
                /* Trigger sign-in modal */
              }}
              className="p-0 h-auto text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
            >
              Log In
            </Button>
          </div>
        </div>
      </footer>
    </div>
  )
}
