import { Linkedin, Github, Globe, Mail } from "lucide-react";

/**
 * A reusable floating footer credit block for any React project.
 * Props allow customizing the creator's name and links.
 */
export interface FooterCreditProps {
  name?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  email?: string;
}

export function FooterCredit({
  name = "Hrishikesh Rathod",
  linkedinUrl = "https://www.linkedin.com/in/hrishikesh-rathod/",
  githubUrl = "https://github.com/rathodhrishikesh/",
  portfolioUrl = "https://hr-msba-portfolio.netlify.app/",
  email = "rathodhrishikesh.career@gmail.com",
}: FooterCreditProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white/90 backdrop-blur border shadow-lg rounded-2xl px-4 py-3 flex flex-col items-end gap-2">
        <p className="text-sm text-gray-600">
          Created by <span className="font-semibold text-gray-900">{name}</span>
        </p>
        <div className="flex gap-2">
          {linkedinUrl && (
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#0A66C2] text-white hover:bg-white hover:text-[#0A66C2] p-2.5 rounded-xl transition"
              title="LinkedIn"
            >
              <Linkedin className="w-5 h-5" />
            </a>
          )}
          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#171515] text-white hover:bg-white hover:text-[#171515] p-2.5 rounded-xl transition"
              title="GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
          )}
          {portfolioUrl && (
            <a
              href={portfolioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl border hover:bg-emerald-50 transition"
              title="Portfolio"
            >
              <Globe className="w-5 h-5 text-emerald-600" />
            </a>
          )}
          {email && (
            <a
              href={`mailto:${email}`}
              className="p-2 rounded-xl border hover:bg-red-50 transition"
              title="Email"
            >
              <Mail className="w-5 h-5 text-red-500" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
