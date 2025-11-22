import { motion } from 'motion/react';
import { ExternalLink, Github } from 'lucide-react';
import { useInView } from './useInView';
import { ImageWithFallback } from './figma/ImageWithFallback';

export function Projects() {
  const [ref, isInView] = useInView({ threshold: 0.2 });

  const projects = [
    {
      title: 'Library System Management',
      description: 'A python application to manage library operations and there are admin dashboard.',
      image: '/assets/library.png',
      gradient: 'from-purple-500 to-pink-500',
      tags: ['Python'],
      githubUrl: 'https://github.com/Ahmed-Tahan7/Library_Management_System',
      demoUrl: '',
    },
    {
      title: 'Password Manager',
      description: 'A password manager application with auto generation and search features.',
      image: '/assets/passwordmanger.png',
      gradient: 'from-pink-500 to-cyan-500',
      tags: ['Python'],
      githubUrl: 'https://github.com/Gawad-B/Password-Manager',
      demoUrl: '',
    },
    {
      title: 'ATTG',
      description: 'Automatic Timetable Generator with constrain satisfaction using CSP Algorithm.',
      image: '/assets/attg.png',
      gradient: 'from-cyan-500 to-purple-500',
      tags: ['Python', 'Typescript', 'TailwindCSS'],
      githubUrl: 'https://github.com/Gawad-B/Automatic-Timetable-Generator',
      demoUrl: '',
    },
    {
      title: 'Portfolio Website',
      description: 'Personal portfolio website to showcase my projects and skills.',
      image: '/assets/portfolio.png',
      gradient: 'from-purple-500 to-cyan-500',
      tags: ['React', 'Typescript', 'TailwindCSS', 'Javascript'],
      githubUrl: 'https://github.com/Gawad-B/Gawad-B.github.io',
      demoUrl: 'https://gawad-b.github.io',
    },
    {
      title: 'RDMID',
      description: 'A web application for managing and generating medical images for rare diseases using AI technology.',
      image: '/assets/RDMID.png',
      gradient: 'from-pink-500 to-purple-500',
      tags: ['Python', 'API', 'Bootstrap CSS', 'Javascript'],
      githubUrl: 'https://github.com/Gawad-B/latent-diffusion-model',
      demoUrl: '',
    },
    {
      title: 'Quizzy',
      description: 'Educational Platform for creating and taking quizzes with real-time feedback and analytics using AI technology.',
      image: '/assets/quizzy.png',
      gradient: 'from-cyan-500 to-pink-500',
      tags: ['Python', 'React', 'PostgreSQL', 'AWS'],
      githubUrl: 'https://github.com/Gawad-B/Quizzy',
      demoUrl: '',
    },
  ];

  return (
    <section id="projects" className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="container mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl mb-12 text-center bg-gradient-to-r from-pink-500 to-cyan-500 bg-clip-text text-transparent">
            My Projects
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <motion.div
                key={project.title}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="group"
              >
                <div className="h-full backdrop-blur-md bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all hover:transform hover:scale-105">
                  <div className="relative h-48 overflow-hidden">
                    <div className={`absolute inset-0 bg-gradient-to-br ${project.gradient} opacity-50`} />
                    <ImageWithFallback
                      src={typeof project.image === 'string' ? project.image : `https://images.unsplash.com/photo-1${Math.floor(Math.random() * 1000000000)}?w=400&h=300&fit=crop`}
                      alt={project.title}
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="mb-2">{project.title}</h3>
                    <p className="text-white/60 mb-4">{project.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-4">
                      {project.demoUrl && (
                        <a
                          href={project.demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Demo</span>
                        </a>
                      )}
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-pink-400 hover:text-pink-300 transition-colors"
                      >
                        <Github className="w-4 h-4" />
                        <span>Code</span>
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
