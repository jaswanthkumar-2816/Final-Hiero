import React from 'react';
import '../styles/resume.css';
import Logo from './Logo';

const ResumeTemplate: React.FC = () => {
    return (
        <div className="resume-view">
            <div className="resume-container">
                {/* Header Section */}
                <header className="resume-header">
                    <div className="header-left">
                        <Logo />
                        <h1 className="main-heading">RESUME</h1>
                        <h2 className="subtitle">Graphic Designer</h2>
                    </div>
                    <div className="header-right">
                        <div className="profile-photo-container">
                            <img src="/profile.jpg" alt="Profile Photo" className="profile-photo" />
                        </div>
                        <div className="name-container">
                            <h3 className="name">HIERO DESIGN</h3>
                        </div>
                    </div>
                </header>

                <div className="resume-body">
                    {/* Left Column */}
                    <aside className="left-column">
                        <section className="section-block contact-info">
                            <div className="contact-box">
                                <span className="icon">✉</span>
                                <span className="text">hello@hierodesign.com</span>
                            </div>
                            <div className="contact-box">
                                <span className="icon">✆</span>
                                <span className="text">+1 (555) 000-1111</span>
                            </div>
                            <div className="contact-box">
                                <span className="icon">🌐</span>
                                <span className="text">www.hierodesign.com</span>
                            </div>
                            <div className="contact-box">
                                <span className="icon">📍</span>
                                <span className="text">Creative Studio, NY</span>
                            </div>
                        </section>

                        <section className="section-block">
                            <h4 className="section-title">EDUCATION</h4>
                            <div className="education-item">
                                <p className="degree">BFA in Graphic Design</p>
                                <p className="university">University of Design</p>
                                <p className="gpa">GPA: 3.9/4.0</p>
                            </div>
                        </section>

                        <section className="section-block">
                            <h4 className="section-title">SKILLS</h4>
                            <div className="skills-container">
                                <div className="skill-item">
                                    <div className="skill-circle" style={{ background: 'conic-gradient(var(--primary-purple) 90%, var(--light-purple) 0)' }}>
                                        <span className="skill-name">Brand Design</span>
                                    </div>
                                </div>
                                <div className="skill-item">
                                    <div className="skill-circle" style={{ background: 'conic-gradient(var(--primary-purple) 85%, var(--light-purple) 0)' }}>
                                        <span className="skill-name">UI/UX</span>
                                    </div>
                                </div>
                                <div className="skill-item">
                                    <div className="skill-circle" style={{ background: 'conic-gradient(var(--primary-purple) 95%, var(--light-purple) 0)' }}>
                                        <span className="skill-name">Illustration</span>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </aside>

                    {/* Right Column */}
                    <main className="right-column">
                        <section className="section-block about-me">
                            <h4 className="section-title">ABOUT ME</h4>
                            <p className="impact-paragraph">
                                Creative and detail-oriented Graphic Designer with over 5 years of experience in crafting compelling brand identities and digital experiences. Passionate about blending aesthetics with functionality to solve complex design challenges and deliver impactful visual stories.
                            </p>
                        </section>

                        <section className="section-block experience">
                            <h4 className="section-title">EXPERIENCE</h4>

                            <div className="experience-item">
                                <div className="exp-header">
                                    <span className="role">Senior Designer</span>
                                    <span className="company">Creative Pulse Agency</span>
                                    <span className="duration">2021 - Present</span>
                                </div>
                                <ul className="bullet-points">
                                    <li>Led the complete rebranding of 15+ corporate clients, increasing brand recognition by an average of 40%.</li>
                                    <li>Designed user interfaces for award-winning mobile applications with over 1M combined downloads.</li>
                                    <li>Mentored a team of 4 junior designers, improving workflow efficiency by 25% through standardized systems.</li>
                                </ul>
                            </div>

                            <div className="experience-item">
                                <div className="exp-header">
                                    <span className="role">Visual Designer</span>
                                    <span className="company">Studio Olive</span>
                                    <span className="duration">2018 - 2021</span>
                                </div>
                                <ul className="bullet-points">
                                    <li>Developed visual assets for high-impact social media campaigns, resulting in a 60% increase in user engagement.</li>
                                    <li>Collaborated with marketing teams to produce cohesive print and digital marketing collateral.</li>
                                    <li>Reduced production turnaround time by 20% by implementing new design automation tools.</li>
                                </ul>
                            </div>

                            <div className="experience-item">
                                <div className="exp-header">
                                    <span className="role">Junior Designer</span>
                                    <span className="company">Beige Horizons Co.</span>
                                    <span className="duration">2016 - 2018</span>
                                </div>
                                <ul className="bullet-points">
                                    <li>Assisted in the creation of brand guidelines for emerging tech startups.</li>
                                    <li>Produced high-quality layout designs for monthly editorial publications.</li>
                                    <li>Managed the preparation of final design files for large-scale commercial printing.</li>
                                </ul>
                            </div>
                        </section>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default ResumeTemplate;
