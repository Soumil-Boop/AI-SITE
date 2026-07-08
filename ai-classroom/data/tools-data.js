/* ── AI TOOL FINDER DATABASE ── */
/* "priority" boosts well-known, highly recommended, student-friendly tools to the top of ties */
const finderTools = [
  // ── TOP RECOMMENDED (highest priority) ──
  { name:'Claude', icon:'🤖', desc:'Excellent at writing, research, analysis, and thoughtful conversation. Known for being safe, nuanced, and accurate.', tags:['writing','research','analysis','coding','studying','homework','essay','summarize','explain','assistant','chatbot'], free:true, priority:10, link:'https://claude.ai' },
  { name:'ChatGPT', icon:'💬', desc:'The most widely used AI chatbot. A strong all-rounder for writing, coding, brainstorming, and answering questions.', tags:['writing','coding','brainstorm','general','studying','homework','essay','question','idea','assistant','chatbot'], free:true, priority:10, link:'https://chat.openai.com' },
  { name:'Khanmigo', icon:'📚', desc:'An AI tutor built specifically for students. It guides you with questions rather than just handing you answers, perfect for school.', tags:['tutor','studying','homework','math','science','history','learn','school'], free:true, priority:9, link:'https://www.khanacademy.org/khan-labs' },
  { name:'Google Gemini', icon:'✨', desc:'Google\'s AI assistant, integrated with Search, Docs, and Gmail. Strong at research and multi-step reasoning.', tags:['writing','research','assistant','chatbot','studying','search','google'], free:true, priority:9, link:'https://gemini.google.com' },
  { name:'Microsoft Copilot', icon:'🪟', desc:'AI built into Microsoft 365, helps you write in Word, analyse data in Excel, build slides in PowerPoint, and manage emails in Outlook.', tags:['office','data','writing','presentation','excel','word','studying'], free:true, priority:8, link:'https://copilot.microsoft.com' },
  { name:'NotebookLM', icon:'📓', desc:'Upload your notes, PDFs, and documents and chat with them. Acts as a research assistant grounded in your own materials.', tags:['research','notes','pdf','study','summarize','documents','studying'], free:true, priority:8, link:'https://notebooklm.google.com' },
  { name:'Grammarly', icon:'📝', desc:'An AI writing assistant that checks grammar, style, tone, and clarity in real time as you write.', tags:['grammar','writing','editing','essay','proofread','spelling','clarity'], free:true, priority:8, link:'https://www.grammarly.com' },
  { name:'GitHub Copilot', icon:'🖥️', desc:'An AI coding assistant that lives inside your code editor. Suggests code as you type and helps you debug.', tags:['coding','code','programming','debug','developer','software'], free:false, priority:8, link:'https://github.com/features/copilot' },
  { name:'Canva AI', icon:'✏️', desc:'A design tool with built-in AI: generate images, write copy, create presentations, and design graphics all in one place.', tags:['design','presentation','image','slides','project','poster','visual','beginner'], free:true, priority:7, link:'https://www.canva.com' },
  { name:'Duolingo', icon:'🦉', desc:'An AI-powered language learning app that adapts to your level, with streaks, stories, and personalised practice.', tags:['language','translate','spanish','french','learn language','vocabulary','speaking'], free:true, priority:7, link:'https://www.duolingo.com' },
  { name:'Midjourney', icon:'🎨', desc:'One of the most popular AI image generators. Creates stunning, artistic visuals from text descriptions.', tags:['image','art','design','creative','picture','drawing','visual'], free:false, priority:7, link:'https://www.midjourney.com' },

  // ── WRITING & EDITING ──
  { name:'QuillBot', icon:'🪶', desc:'AI paraphrasing and summarizing tool, popular with students for rewriting and condensing text.', tags:['writing','paraphrase','summarize','essay','rewrite'], free:true, priority:5, link:'https://quillbot.com' },
  { name:'Hemingway Editor', icon:'📏', desc:'Highlights overly complex sentences and suggests simpler, clearer writing.', tags:['writing','editing','clarity','essay','readability'], free:true, priority:4, link:'https://hemingwayapp.com' },
  { name:'Jasper', icon:'🧙', desc:'AI writing tool aimed at marketing and content creation, good for blogs and ad copy.', tags:['writing','marketing','content','blog'], free:false, priority:3, link:'https://www.jasper.ai' },
  { name:'Copy.ai', icon:'📋', desc:'Generates marketing copy, social posts, and product descriptions quickly.', tags:['writing','marketing','content','copywriting'], free:true, priority:3, link:'https://www.copy.ai' },
  { name:'Sudowrite', icon:'✍️', desc:'AI tool built specifically for fiction writers, helps brainstorm plots and write vivid scenes.', tags:['writing','creative','fiction','story','novel'], free:false, priority:3, link:'https://www.sudowrite.com' },
  { name:'Wordtune', icon:'🎵', desc:'Rewrites sentences to sound clearer, more formal, or more casual, with one click.', tags:['writing','editing','rewrite','tone','essay'], free:true, priority:4, link:'https://www.wordtune.com' },
  { name:'ProWritingAid', icon:'🔍', desc:'In-depth grammar and style checker with detailed writing reports, popular for long-form work.', tags:['writing','grammar','editing','essay','style'], free:true, priority:4, link:'https://prowritingaid.com' },
  { name:'Scribbr AI Proofreader', icon:'🎓', desc:'AI proofreading tool tailored for academic papers and theses.', tags:['writing','grammar','academic','essay','thesis','proofread'], free:false, priority:4, link:'https://www.scribbr.com' },
  { name:'Outwrite', icon:'📤', desc:'Grammar, style, and readability checker with a focus on academic and professional writing.', tags:['writing','grammar','editing','academic'], free:true, priority:2, link:'https://www.outwrite.com' },
  { name:'Writesonic', icon:'🚀', desc:'AI writer for articles, essays, and ad copy with multiple tone options.', tags:['writing','content','essay','article'], free:true, priority:2, link:'https://writesonic.com' },
  { name:'Rytr', icon:'🖋️', desc:'Budget-friendly AI writing assistant for short-form content and emails.', tags:['writing','content','email'], free:true, priority:2, link:'https://rytr.me' },
  { name:'INK Editor', icon:'🖊️', desc:'SEO-focused AI writing tool, useful for students building websites or blogs.', tags:['writing','seo','blog','content'], free:true, priority:1, link:'https://inkforall.com' },
  { name:'Sapling', icon:'🌱', desc:'Grammar and writing assistant with a focus on professional messaging.', tags:['writing','grammar','editing','email'], free:true, priority:2, link:'https://sapling.ai' },
  { name:'LanguageTool', icon:'🧰', desc:'Open-source grammar and style checker supporting many languages.', tags:['writing','grammar','editing','language','proofread'], free:true, priority:3, link:'https://languagetool.org' },
  { name:'Slick Write', icon:'💡', desc:'Free writing tool that flags errors, style issues, and gives statistics on your prose.', tags:['writing','grammar','style','essay'], free:true, priority:1, link:'https://slickwrite.com' },

  // ── CODING & DEVELOPMENT ──
  { name:'Replit AI (Ghostwriter)', icon:'👻', desc:'AI coding assistant built into the Replit online code editor, great for beginners.', tags:['coding','code','programming','beginner','editor'], free:true, priority:6, link:'https://replit.com' },
  { name:'Cursor', icon:'🖱️', desc:'An AI-first code editor that lets you chat with your codebase and generate code naturally.', tags:['coding','code','programming','editor','developer'], free:true, priority:6, link:'https://www.cursor.com' },
  { name:'Tabnine', icon:'⌨️', desc:'AI code completion tool that works across many editors and languages.', tags:['coding','code','programming','autocomplete'], free:true, priority:4, link:'https://www.tabnine.com' },
  { name:'Amazon CodeWhisperer', icon:'☁️', desc:'AWS\'s free AI coding companion, integrates with popular IDEs.', tags:['coding','code','programming','aws','developer'], free:true, priority:4, link:'https://aws.amazon.com/codewhisperer' },
  { name:'Codeium', icon:'🧩', desc:'Free AI code completion and chat tool supporting dozens of languages.', tags:['coding','code','programming','free','autocomplete'], free:true, priority:5, link:'https://codeium.com' },
  { name:'Sourcegraph Cody', icon:'🔭', desc:'AI coding assistant that understands your whole codebase for smarter suggestions.', tags:['coding','code','programming','developer'], free:true, priority:3, link:'https://sourcegraph.com/cody' },
  { name:'CodeT5', icon:'🔧', desc:'Open-source AI model for code generation and understanding, good for learning how code AI works.', tags:['coding','code','programming','learning','open source'], free:true, priority:2, link:'https://github.com/salesforce/CodeT5' },
  { name:'Phind', icon:'🔎', desc:'AI search engine built specifically for developers and technical questions.', tags:['coding','search','developer','programming','debug'], free:true, priority:4, link:'https://www.phind.com' },
  { name:'CodeWP', icon:'🌐', desc:'AI code generator focused on WordPress development.', tags:['coding','wordpress','web','developer'], free:true, priority:1, link:'https://codewp.ai' },
  { name:'Mintlify', icon:'📘', desc:'AI tool that automatically writes documentation for your code.', tags:['coding','documentation','developer'], free:true, priority:1, link:'https://mintlify.com' },

  // ── IMAGE & ART GENERATION ──
  { name:'DALL·E 3', icon:'🖼️', desc:'OpenAI\'s image generator, creates photorealistic images and illustrations from text, built into ChatGPT Plus.', tags:['image','art','design','creative','picture','visual'], free:false, priority:6, link:'https://openai.com/dall-e-3' },
  { name:'Adobe Firefly', icon:'🔥', desc:'Adobe\'s AI image generator, integrated into Photoshop and Illustrator for creative projects.', tags:['image','art','design','creative','photoshop','visual'], free:true, priority:5, link:'https://www.adobe.com/products/firefly.html' },
  { name:'Leonardo AI', icon:'🦁', desc:'Free-friendly AI art generator popular for game assets, characters, and concept art.', tags:['image','art','design','creative','game','character'], free:true, priority:4, link:'https://leonardo.ai' },
  { name:'Stable Diffusion', icon:'🌀', desc:'Open-source AI image generator that can run locally or through many free web interfaces.', tags:['image','art','creative','open source','free'], free:true, priority:4, link:'https://stability.ai' },
  { name:'Bing Image Creator', icon:'🪁', desc:'Free AI image generator powered by DALL·E, built into Microsoft Bing and Edge.', tags:['image','art','free','design','creative'], free:true, priority:5, link:'https://www.bing.com/images/create' },
  { name:'Playground AI', icon:'🎡', desc:'Free, beginner-friendly AI image generator with an easy visual interface.', tags:['image','art','beginner','free','design'], free:true, priority:3, link:'https://playground.com' },
  { name:'NightCafe', icon:'☕', desc:'Community-driven AI art generator with multiple art styles to explore.', tags:['image','art','creative','community'], free:true, priority:2, link:'https://creator.nightcafe.studio' },
  { name:'Craiyon', icon:'🖍️', desc:'Free, simple AI image generator great for quick, casual image experiments.', tags:['image','art','free','beginner','simple'], free:true, priority:2, link:'https://www.craiyon.com' },
  { name:'Lexica', icon:'🔮', desc:'Searchable library of AI-generated art with prompts you can learn from and remix.', tags:['image','art','inspiration','prompts'], free:true, priority:2, link:'https://lexica.art' },
  { name:'Microsoft Designer', icon:'🖌️', desc:'AI design tool for posters, social posts, and presentations using simple prompts.', tags:['design','image','presentation','poster','visual'], free:true, priority:3, link:'https://designer.microsoft.com' },
  { name:'Remove.bg', icon:'✂️', desc:'AI tool that automatically removes image backgrounds in seconds.', tags:['image','design','editing','photo'], free:true, priority:2, link:'https://www.remove.bg' },
  { name:'Photoroom', icon:'📸', desc:'AI photo editor for removing backgrounds and creating product photos.', tags:['image','design','editing','photo'], free:true, priority:1, link:'https://www.photoroom.com' },
  { name:'Let\'s Enhance', icon:'🔬', desc:'AI tool to upscale and sharpen low-resolution images.', tags:['image','editing','photo','upscale'], free:true, priority:1, link:'https://letsenhance.io' },

  // ── VIDEO ──
  { name:'Runway', icon:'🎬', desc:'AI video generation and editing tool, can create video from text prompts or edit existing footage.', tags:['video','editing','creative','film'], free:true, priority:4, link:'https://runwayml.com' },
  { name:'Pictory', icon:'🎞️', desc:'Turns scripts or articles into short videos automatically using AI.', tags:['video','editing','content','presentation'], free:true, priority:3, link:'https://pictory.ai' },
  { name:'Synthesia', icon:'🎭', desc:'Creates AI avatar videos from text, useful for presentations without filming yourself.', tags:['video','presentation','avatar'], free:false, priority:3, link:'https://www.synthesia.io' },
  { name:'CapCut', icon:'✂️', desc:'Free video editor with AI features like auto-captions and background removal, popular with students.', tags:['video','editing','free','captions'], free:true, priority:5, link:'https://www.capcut.com' },
  { name:'Descript', icon:'🎙️', desc:'Edit video and audio by editing text, AI transcribes and lets you cut by deleting words.', tags:['video','audio','editing','transcribe','podcast'], free:true, priority:4, link:'https://www.descript.com' },
  { name:'Opus Clip', icon:'📎', desc:'AI tool that automatically clips long videos into short, shareable highlights.', tags:['video','editing','content','social'], free:true, priority:2, link:'https://www.opus.pro' },
  { name:'HeyGen', icon:'🗣️', desc:'Creates AI avatar presenter videos from a script, useful for class presentations.', tags:['video','presentation','avatar'], free:true, priority:3, link:'https://www.heygen.com' },
  { name:'Pika', icon:'🐹', desc:'AI tool for generating short video clips from text or images.', tags:['video','creative','generate'], free:true, priority:2, link:'https://pika.art' },

  // ── AUDIO & MUSIC ──
  { name:'ElevenLabs', icon:'🔊', desc:'Realistic AI voice generator and text-to-speech tool, popular for narration and accessibility.', tags:['audio','voice','speech','narration','accessibility'], free:true, priority:4, link:'https://elevenlabs.io' },
  { name:'Suno', icon:'🎵', desc:'AI music generator that creates full songs, including vocals, from text prompts.', tags:['music','audio','creative','song'], free:true, priority:4, link:'https://suno.com' },
  { name:'Udio', icon:'🎼', desc:'AI music generation tool for creating original songs from text descriptions.', tags:['music','audio','creative','song'], free:true, priority:2, link:'https://www.udio.com' },
  { name:'Otter.ai', icon:'🦦', desc:'AI meeting and lecture transcription tool, great for turning class recordings into notes.', tags:['audio','transcribe','notes','lecture','studying'], free:true, priority:5, link:'https://otter.ai' },
  { name:'Murf AI', icon:'🎤', desc:'AI voiceover generator for presentations, videos, and e-learning content.', tags:['audio','voice','presentation','narration'], free:true, priority:2, link:'https://murf.ai' },
  { name:'Speechify', icon:'📢', desc:'Text-to-speech app that reads articles, PDFs, and textbooks aloud, useful for studying on the go.', tags:['audio','accessibility','studying','reading','textbook'], free:true, priority:5, link:'https://speechify.com' },
  { name:'Krisp', icon:'🎧', desc:'AI tool that removes background noise from calls and recordings.', tags:['audio','noise','call','recording'], free:true, priority:1, link:'https://krisp.ai' },
  { name:'Soundraw', icon:'🌊', desc:'AI music generator for royalty-free background tracks for videos and projects.', tags:['music','audio','video','creative'], free:true, priority:2, link:'https://soundraw.io' },

  // ── RESEARCH & STUDY ──
  { name:'Perplexity AI', icon:'❓', desc:'AI search engine that answers questions with cited sources, great for research with built-in citations.', tags:['research','search','studying','citation','question'], free:true, priority:7, link:'https://www.perplexity.ai' },
  { name:'Consensus', icon:'🧪', desc:'AI search engine for finding answers backed by peer-reviewed scientific research.', tags:['research','science','studying','academic','citation'], free:true, priority:5, link:'https://consensus.app' },
  { name:'Elicit', icon:'🔬', desc:'AI research assistant that helps find and summarize academic papers.', tags:['research','academic','studying','papers'], free:true, priority:4, link:'https://elicit.com' },
  { name:'SciSpace', icon:'📑', desc:'AI tool that explains complex academic papers in simple language.', tags:['research','academic','studying','papers','explain'], free:true, priority:4, link:'https://typeset.io' },
  { name:'Wolfram Alpha', icon:'🧮', desc:'Computational engine that solves math problems step by step and answers factual questions.', tags:['math','studying','homework','calculation','science'], free:true, priority:6, link:'https://www.wolframalpha.com' },
  { name:'Photomath', icon:'📷', desc:'Scan a math problem with your phone camera and get a step-by-step solution.', tags:['math','studying','homework','calculation'], free:true, priority:6, link:'https://photomath.com' },
  { name:'Socratic by Google', icon:'🦉', desc:'AI homework helper that explains concepts across subjects using your phone camera.', tags:['studying','homework','tutor','explain'], free:true, priority:5, link:'https://socratic.org' },
  { name:'Quizlet', icon:'🃏', desc:'Study app with AI-generated flashcards, practice tests, and explanations.', tags:['studying','flashcards','memorize','test','homework'], free:true, priority:6, link:'https://quizlet.com' },
  { name:'StudyFetch', icon:'🧠', desc:'AI study assistant that creates personalized study guides from your course materials.', tags:['studying','homework','notes','guide'], free:true, priority:3, link:'https://studyfetch.com' },
  { name:'Numerade', icon:'🔢', desc:'AI and video explanations for math and science textbook problems.', tags:['math','science','studying','homework','textbook'], free:false, priority:3, link:'https://www.numerade.com' },
  { name:'Brainly', icon:'🧩', desc:'Homework help community enhanced with AI-generated explanations.', tags:['studying','homework','question','community'], free:true, priority:3, link:'https://brainly.com' },
  { name:'CourseHero AI', icon:'🎯', desc:'AI study tools including tutoring, writing help, and practice problems.', tags:['studying','homework','tutor','writing'], free:false, priority:2, link:'https://www.coursehero.com' },
  { name:'Glasp AI', icon:'🖇️', desc:'AI tool that summarizes articles and YouTube videos for faster studying.', tags:['research','summarize','studying','article','video'], free:true, priority:2, link:'https://glasp.co' },
  { name:'Explainpaper', icon:'📃', desc:'Highlight confusing parts of a research paper and get an AI explanation.', tags:['research','academic','studying','papers','explain'], free:true, priority:3, link:'https://www.explainpaper.com' },

  // ── PRODUCTIVITY & ORGANIZATION ──
  { name:'Notion AI', icon:'🗒️', desc:'AI built into Notion for writing, summarizing notes, and organizing study plans.', tags:['notes','studying','organization','writing','productivity'], free:true, priority:5, link:'https://www.notion.so/product/ai' },
  { name:'Mem', icon:'🧠', desc:'AI-powered note-taking app that automatically organizes and connects your notes.', tags:['notes','studying','organization','productivity'], free:true, priority:2, link:'https://get.mem.ai' },
  { name:'Reclaim AI', icon:'📅', desc:'AI calendar assistant that automatically schedules study time and tasks.', tags:['productivity','schedule','time management','calendar'], free:true, priority:2, link:'https://reclaim.ai' },
  { name:'Motion', icon:'⏱️', desc:'AI planner that builds your daily schedule automatically based on your tasks and deadlines.', tags:['productivity','schedule','time management','planning'], free:false, priority:2, link:'https://www.usemotion.com' },
  { name:'Todoist AI', icon:'✅', desc:'To-do list app with AI features to help prioritize and organize tasks.', tags:['productivity','tasks','organization','planning'], free:true, priority:2, link:'https://todoist.com' },
  { name:'Taskade', icon:'📋', desc:'AI-powered workspace for to-do lists, notes, and project planning together.', tags:['productivity','tasks','organization','project'], free:true, priority:1, link:'https://www.taskade.com' },
  { name:'Goblin Tools', icon:'👹', desc:'Simple AI tools that break overwhelming tasks into small, manageable steps.', tags:['productivity','planning','organization','tasks'], free:true, priority:3, link:'https://goblin.tools' },

  // ── PRESENTATIONS & DESIGN ──
  { name:'Gamma', icon:'🎯', desc:'AI tool that turns an outline or topic into a polished presentation or document in minutes.', tags:['presentation','slides','design','project'], free:true, priority:6, link:'https://gamma.app' },
  { name:'Beautiful.ai', icon:'💎', desc:'AI presentation tool that automatically formats slides as you add content.', tags:['presentation','slides','design'], free:true, priority:3, link:'https://www.beautiful.ai' },
  { name:'Tome', icon:'📖', desc:'AI tool for generating narrative presentations and pitch decks from a prompt.', tags:['presentation','slides','design','project'], free:true, priority:3, link:'https://tome.app' },
  { name:'Slidesgo AI', icon:'🖥️', desc:'AI-assisted templates for building school and work presentations quickly.', tags:['presentation','slides','design','template'], free:true, priority:2, link:'https://slidesgo.com' },
  { name:'Designs.ai', icon:'🎨', desc:'All-in-one AI design suite for logos, videos, and graphics.', tags:['design','image','video','logo'], free:false, priority:1, link:'https://designs.ai' },

  // ── DATA & SPREADSHEETS ──
  { name:'Julius AI', icon:'📊', desc:'AI tool that analyzes data and creates charts just by describing what you want in plain English.', tags:['data','analysis','spreadsheet','chart','excel'], free:true, priority:4, link:'https://julius.ai' },
  { name:'Rows AI', icon:'🧾', desc:'Spreadsheet tool with built-in AI for formulas, analysis, and automation.', tags:['data','spreadsheet','excel','analysis'], free:true, priority:2, link:'https://rows.com' },
  { name:'Akkio', icon:'📈', desc:'No-code AI tool for building data predictions and models without programming.', tags:['data','analysis','prediction'], free:false, priority:1, link:'https://www.akkio.com' },
  { name:'Obviously AI', icon:'🔍', desc:'No-code machine learning platform for making predictions from spreadsheet data.', tags:['data','analysis','prediction','spreadsheet'], free:false, priority:1, link:'https://www.obviously.ai' },

  // ── TRANSLATION & LANGUAGE ──
  { name:'DeepL', icon:'🌍', desc:'The most accurate AI translation tool available, outperforms Google Translate on nuance and natural phrasing.', tags:['translate','language','writing','french','spanish'], free:true, priority:6, link:'https://www.deepl.com' },
  { name:'Google Translate', icon:'🗺️', desc:'Free, widely available AI translation tool supporting over 100 languages.', tags:['translate','language','free'], free:true, priority:5, link:'https://translate.google.com' },
  { name:'Reverso', icon:'🔄', desc:'Translation tool with example sentences in context, useful for learning grammar.', tags:['translate','language','grammar','learning'], free:true, priority:2, link:'https://www.reverso.net' },
  { name:'Babbel', icon:'💬', desc:'Structured language learning app with AI-driven lessons and speech recognition.', tags:['language','learn language','speaking','vocabulary'], free:false, priority:3, link:'https://www.babbel.com' },
  { name:'Memrise', icon:'🧠', desc:'AI-enhanced vocabulary and language learning app using spaced repetition.', tags:['language','vocabulary','learn language','memorize'], free:true, priority:3, link:'https://www.memrise.com' },
  { name:'ELSA Speak', icon:'🗣️', desc:'AI tool that gives feedback on your English pronunciation in real time.', tags:['language','speaking','pronunciation','english'], free:true, priority:2, link:'https://elsaspeak.com' },
  { name:'Lingvanex', icon:'🌐', desc:'AI translation tool that works across text, voice, and documents.', tags:['translate','language','document'], free:true, priority:1, link:'https://lingvanex.com' },

  // ── 3D, GAMES & DESIGN ──
  { name:'Meshy', icon:'🧱', desc:'AI tool that generates 3D models from text or images, useful for game design projects.', tags:['3d','design','game','creative'], free:true, priority:2, link:'https://www.meshy.ai' },
  { name:'Scenario', icon:'🎮', desc:'AI tool for generating game art assets in consistent styles.', tags:['game','art','design','creative'], free:true, priority:1, link:'https://www.scenario.com' },
  { name:'Charmed AI', icon:'🪄', desc:'AI tool for generating game characters and concept art.', tags:['game','art','character','design'], free:true, priority:1, link:'https://charmed.ai' },
  { name:'Promethean AI', icon:'🏛️', desc:'AI assistant for building 3D virtual worlds and game environments.', tags:['3d','game','design','creative'], free:false, priority:1, link:'https://www.prometheanai.com' },

  // ── BUSINESS, CAREER & RESUME ──
  { name:'Teal', icon:'💼', desc:'AI resume builder and job application tracker, popular with students entering the job market.', tags:['career','resume','job','interview'], free:true, priority:4, link:'https://www.tealhq.com' },
  { name:'Kickresume', icon:'🚀', desc:'AI tool for writing and formatting professional resumes and cover letters.', tags:['career','resume','job','cover letter'], free:true, priority:3, link:'https://www.kickresume.com' },
  { name:'Yoodli', icon:'🎤', desc:'AI speech coach that gives feedback on presentations, interviews, and public speaking.', tags:['career','interview','presentation','speaking'], free:true, priority:3, link:'https://yoodli.ai' },
  { name:'Interview Warmup by Google', icon:'🔥', desc:'Free AI tool that helps you practice answering common interview questions.', tags:['career','interview','job','practice'], free:true, priority:3, link:'https://grow.google/certificates/interview-warmup' },
  { name:'Huntr', icon:'🎯', desc:'AI-powered job search tracker and resume tailoring tool.', tags:['career','job','resume','tracker'], free:true, priority:2, link:'https://huntr.co' },
  { name:'LinkedIn AI Tools', icon:'🔗', desc:'AI features built into LinkedIn for writing posts, summaries, and connecting with recruiters.', tags:['career','job','networking','writing'], free:true, priority:2, link:'https://www.linkedin.com' },

  // ── ACCESSIBILITY ──
  { name:'Be My AI', icon:'👁️', desc:'AI tool that describes images and surroundings aloud for blind and low-vision users.', tags:['accessibility','vision','image','describe'], free:true, priority:3, link:'https://www.bemyeyes.com' },
  { name:'Otter.ai Live Captions', icon:'💬', desc:'Real-time AI captioning for lectures and meetings, helpful for students who are deaf or hard of hearing.', tags:['accessibility','captions','lecture','hearing'], free:true, priority:3, link:'https://otter.ai' },
  { name:'Read&Write', icon:'📖', desc:'AI literacy support tool with text-to-speech, word prediction, and translation for students with learning differences.', tags:['accessibility','reading','writing','dyslexia','studying'], free:false, priority:3, link:'https://www.texthelp.com/products/read-and-write-education' },
  { name:'Immersive Reader', icon:'🔤', desc:'Free Microsoft tool that reads text aloud and simplifies pages for easier reading and focus.', tags:['accessibility','reading','studying','focus'], free:true, priority:3, link:'https://www.microsoft.com/en-us/education/products/immersive-reader' },

  // ── SAFETY & WELLBEING ──
  { name:'Woebot', icon:'🤍', desc:'AI chatbot designed to support mental wellbeing using cognitive behavioral techniques.', tags:['wellbeing','mental health','support','chatbot'], free:true, priority:2, link:'https://woebothealth.com' },
  { name:'Replika', icon:'💙', desc:'AI companion chatbot for casual conversation, note: not a substitute for real mental health support.', tags:['chatbot','companion','wellbeing'], free:true, priority:1, link:'https://replika.com' },

  // ── MISC USEFUL TOOLS ──
  { name:'Cleanup.pictures', icon:'🧽', desc:'AI tool that removes unwanted objects from photos automatically.', tags:['image','editing','photo'], free:true, priority:1, link:'https://cleanup.pictures' },
  { name:'Magic Eraser', icon:'🪄', desc:'AI photo editing tool for quickly erasing unwanted elements.', tags:['image','editing','photo'], free:true, priority:1, link:'https://magicstudio.com/magiceraser' },
  { name:'PDF.ai', icon:'📄', desc:'Chat with any PDF to quickly find answers and summaries from long documents.', tags:['pdf','research','studying','document','summarize'], free:true, priority:3, link:'https://pdf.ai' },
  { name:'ChatPDF', icon:'📑', desc:'Upload a PDF and ask questions about it directly, useful for textbooks and long readings.', tags:['pdf','research','studying','document','summarize'], free:true, priority:3, link:'https://www.chatpdf.com' },
  { name:'Humata', icon:'🔬', desc:'AI tool for asking questions across multiple research documents at once.', tags:['research','document','studying','pdf'], free:true, priority:2, link:'https://www.humata.ai' },
  { name:'TLDR This', icon:'📰', desc:'Summarizes long articles into key points in seconds.', tags:['summarize','research','studying','article'], free:true, priority:3, link:'https://tldrthis.com' },
  { name:'Recall', icon:'🧷', desc:'AI tool that automatically summarizes and organizes things you read online.', tags:['summarize','research','studying','organization'], free:true, priority:2, link:'https://www.getrecall.ai' },
  { name:'Poe by Quora', icon:'🦉', desc:'A single app that gives access to many different AI chatbots, including Claude and ChatGPT, in one place.', tags:['chatbot','assistant','writing','general'], free:true, priority:4, link:'https://poe.com' },
  { name:'You.com', icon:'🔍', desc:'AI search engine that combines web search with chatbot-style answers and citations.', tags:['search','research','chatbot','citation'], free:true, priority:3, link:'https://you.com' },
  { name:'Character.AI', icon:'🎭', desc:'Chat with AI characters for creative roleplay, practicing conversations, or language practice.', tags:['chatbot','creative','roleplay','language'], free:true, priority:2, link:'https://character.ai' },
  { name:'Pi by Inflection', icon:'🥧', desc:'A conversational AI designed for supportive, friendly everyday chat and brainstorming.', tags:['chatbot','assistant','conversation'], free:true, priority:2, link:'https://pi.ai' }
];
