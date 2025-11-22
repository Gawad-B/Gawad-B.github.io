import { motion } from 'motion/react';
import { useInView } from './useInView';

export function About() {
  const [ref, isInView] = useInView({ threshold: 0.2 });

  return (
    <section id="about" className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="container mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <h2 className="text-4xl md:text-5xl mb-8 text-center bg-gradient-to-r from-purple-500 to-cyan-500 bg-clip-text text-transparent">
            About Me
          </h2>

          <div className="backdrop-blur-md bg-white/5 rounded-3xl p-8 md:p-12 border border-white/10 shadow-2xl">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                <div className="aspect-square rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 p-1">
                  <div className="w-full h-full rounded-2xl bg-black flex items-center justify-center text-8xl">
                    🧬
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="space-y-4 text-white/80"
              >
                <p>
                  I’m a Computer Science student with a minor in Bioinformatics, passionate about creating practical and impactful technology. 
                  I work primarily as a Python developer and web developer, building efficient tools, clean backend systems, and modern web experiences.
                </p>
                <p>
                  Alongside my core development work, I also have foundational knowledge in cybersecurity, 
                  which helps me apply secure coding practices and better understand how to protect applications and data.
                </p>
                <p>
                  I enjoy exploring the intersection of software, biology, and innovation, 
                  and I’m always learning new technologies to grow both as a developer and a problem-solver.
                </p>
                <div className="flex flex-wrap gap-3 pt-4">
                  <span className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                    Creative
                  </span>
                  <span className="px-4 py-2 rounded-full bg-gradient-to-r from-pink-500/20 to-cyan-500/20 border border-pink-500/30">
                    Innovative
                  </span>
                  <span className="px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30">
                    Detail-Oriented
                  </span>
                  <span className="px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30">
                    Dedicated
                  </span>
                  <span className="px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30">
                    Adaptable
                  </span>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
