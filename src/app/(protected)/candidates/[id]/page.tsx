import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function CandidatePage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: resume, error } = await supabase
    .from("resumes")
    .select("*")
    .eq("id", params.id)
    .eq("status", "active")
    .single();

  if (error || !resume) {
    notFound();
  }

  const parsedData = resume.parsed_data as any;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/dashboard" className="text-primary hover:underline">
          ← Назад к поиску
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{resume.full_name}</h1>
            <p className="text-xl text-gray-600">{resume.last_position}</p>
            <p className="text-gray-500">{resume.last_company}</p>
          </div>
          <div className="text-right">
            <button className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-600 mb-2">
              В избранное
            </button>
            <p className="text-sm text-gray-500">
              Качество резюме: {resume.quality_score?.toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 p-4 bg-gray-50 rounded-lg">
          {resume.email && (
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{resume.email}</p>
            </div>
          )}
          {resume.phone && (
            <div>
              <p className="text-sm text-gray-600">Телефон</p>
              <p className="font-medium">{resume.phone}</p>
            </div>
          )}
          {resume.location && (
            <div>
              <p className="text-sm text-gray-600">Локация</p>
              <p className="font-medium">{resume.location}</p>
            </div>
          )}
        </div>

        {/* Professional Summary */}
        {parsedData?.professional?.summary && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-3">О кандидате</h2>
            <p className="text-gray-700">{parsedData.professional.summary}</p>
          </div>
        )}

        {/* Skills */}
        {resume.skills && resume.skills.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Навыки</h2>
            <div className="flex flex-wrap gap-2">
              {resume.skills.map((skill: string, idx: number) => (
                <span
                  key={idx}
                  className="bg-primary-50 text-primary px-3 py-1 rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {parsedData?.experience && parsedData.experience.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Опыт работы</h2>
            <div className="space-y-6">
              {parsedData.experience.map((exp: any, idx: number) => (
                <div key={idx} className="border-l-2 border-primary pl-4">
                  <h3 className="font-semibold text-lg">{exp.position}</h3>
                  <p className="text-primary font-medium">{exp.company}</p>
                  <p className="text-sm text-gray-500 mb-2">
                    {exp.startDate} - {exp.endDate || "настоящее время"}
                  </p>
                  <p className="text-gray-700 mb-2">{exp.description}</p>
                  {exp.achievements && exp.achievements.length > 0 && (
                    <ul className="list-disc list-inside text-gray-700">
                      {exp.achievements.map((achievement: string, aidx: number) => (
                        <li key={aidx}>{achievement}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {parsedData?.education && parsedData.education.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Образование</h2>
            <div className="space-y-4">
              {parsedData.education.map((edu: any, idx: number) => (
                <div key={idx}>
                  <h3 className="font-semibold">{edu.institution}</h3>
                  <p className="text-gray-700">
                    {edu.degree} - {edu.field}
                  </p>
                  <p className="text-sm text-gray-500">
                    {edu.startDate} - {edu.endDate}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {parsedData?.languages && parsedData.languages.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Языки</h2>
            <div className="flex flex-wrap gap-3">
              {parsedData.languages.map((lang: any, idx: number) => (
                <div key={idx} className="bg-gray-100 px-4 py-2 rounded-lg">
                  <span className="font-medium">{lang.language}</span>
                  <span className="text-gray-600 ml-2">({lang.level})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Info */}
        {parsedData?.additional && (
          <div>
            {parsedData.additional.certifications &&
              parsedData.additional.certifications.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">Сертификаты</h2>
                  <ul className="list-disc list-inside text-gray-700">
                    {parsedData.additional.certifications.map((cert: string, idx: number) => (
                      <li key={idx}>{cert}</li>
                    ))}
                  </ul>
                </div>
              )}

            {parsedData.additional.projects && parsedData.additional.projects.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3">Проекты</h2>
                <ul className="list-disc list-inside text-gray-700">
                  {parsedData.additional.projects.map((project: string, idx: number) => (
                    <li key={idx}>{project}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

