import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the ScholarHub team.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Contact Us</h1>
      <p className="mt-3 text-muted-foreground">
        Spotted incorrect information on a listing, or want to suggest a source? Let us know.
      </p>

      <form className="mt-8 space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="message">Message</Label>
          <Textarea id="message" name="message" rows={5} required />
        </div>
        <Button type="submit" className="gap-2">
          <Mail className="h-4 w-4" /> Send Message
        </Button>
      </form>
    </div>
  );
}
