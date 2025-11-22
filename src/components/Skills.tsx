import { motion } from 'motion/react';
import { Code2, Palette, Database, Zap, Globe, Smartphone } from 'lucide-react';
import { useInView } from './useInView';

export function Skills() {
  const [ref, isInView] = useInView({ threshold: 0.2 });

  const skills = [
    {
      icon: Code2,
      title: 'Frontend Development',
      description: 'React, TypeScript, Tailwind CSS',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: Database,
      title: 'Backend Development',
      description: 'Node.js, Flask, Databases',
      gradient: 'from-pink-500 to-cyan-500',
    },
    {
      icon: Palette,
      title: 'UI/UX Design',
      description: 'Figma, Adobe XD, Responsive Design',
      gradient: 'from-cyan-500 to-purple-500',
    },
    {
      icon: Zap,
      title: 'Performance',
      description: 'Optimization, Fast Loading, SEO',
      gradient: 'from-purple-500 to-cyan-500',
    },
    {
      icon: Globe,
      title: 'Web Technologies',
      description: 'HTML5, CSS3, JavaScript ES6+',
      gradient: 'from-pink-500 to-purple-500',
    },
    {
      icon: Smartphone,
      title: 'Mobile Development',
      description: 'React Native, Progressive Web Apps',
      gradient: 'from-cyan-500 to-pink-500',
    },
  ];

  return (
    <section id="skills" className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="container mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl mb-12 text-center bg-gradient-to-r from-cyan-500 to-purple-500 bg-clip-text text-transparent">
            My Skills
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {skills.map((skill, index) => {
              const Icon = skill.icon;
              return (
                <motion.div
                  key={skill.title}
                  initial={{ opacity: 0, y: 50 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="group"
                >
                  <div className="h-full backdrop-blur-md bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all hover:transform hover:scale-105">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${skill.gradient} p-3 mb-4`}>
                      <Icon className="w-full h-full text-white" />
                    </div>
                    <h3 className="mb-2">{skill.title}</h3>
                    <p className="text-white/60">{skill.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
