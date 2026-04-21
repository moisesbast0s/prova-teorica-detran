import { PrismaClient, Topic, Difficulty } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

// Mapeamento de parte (int) -> Topic
const topicMap: Record<number, Topic> = {
  1: 'SINALIZACAO_VIARIA',
  2: 'LEGISLACAO_TRANSITO',
  3: 'DIRECAO_DEFENSIVA',
  4: 'PRIMEIROS_SOCORROS',
  5: 'MEIO_AMBIENTE',
  6: 'MECANICA_BASICA',
  7: 'CIDADANIA',
}

const difficultyMap: Record<string, Difficulty> = {
  facil: 'FACIL',
  intermediario: 'MEDIO',
  medio: 'MEDIO',
  dificil: 'DIFICIL',
}

interface RawQuestion {
  id: string
  parte: number
  modulo_numero: number
  modulo_titulo: string
  numero: number
  dificuldade: string
  enunciado: string
  alternativa_correta: string
  alternativas_incorretas: string[]
  comentario: string
  codigo_placa: string | null
  fonte?: string
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

async function loadQuestions(): Promise<RawQuestion[]> {
  const localPath = path.join(process.cwd(), 'prisma', 'questions.json')

  if (fs.existsSync(localPath)) {
    console.log('📁 Carregando questões do arquivo local...')
    const raw = fs.readFileSync(localPath, 'utf-8')
    return JSON.parse(raw)
  }

  console.log('🌐 Baixando questões do GitHub...')
  const url =
    'https://github.com/oprimodev/teorical-questions-detran/raw/refs/heads/main/tools/extractor/data/questions.json'
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Falha ao baixar questões: ${res.status}`)
  const data = await res.json()

  // Salvar localmente para próximas execuções
  fs.writeFileSync(localPath, JSON.stringify(data, null, 2))
  console.log('💾 Questões salvas em prisma/questions.json')

  return data
}

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  const questions: RawQuestion[] = await loadQuestions()
  console.log(`📋 Total de questões encontradas: ${questions.length}`)

  let processed = 0
  let skipped = 0

  for (const q of questions) {
    const topic = topicMap[q.parte] ?? 'LEGISLACAO_TRANSITO'
    const difficulty = difficultyMap[q.dificuldade.toLowerCase()] ?? 'MEDIO'

    // Montar as 4 alternativas embaralhadas
    const letters = ['a', 'b', 'c', 'd']
    const allTexts = shuffle([q.alternativa_correta, ...q.alternativas_incorretas.slice(0, 3)])

    const options = allTexts.map((text, i) => ({
      letter: letters[i],
      text,
      isCorrect: text === q.alternativa_correta,
    }))

    try {
      await prisma.question.upsert({
        where: { externalId: q.id },
        update: {
          statement: q.enunciado,
          topic,
          difficulty,
          explanation: q.comentario ?? '',
          moduleNumber: q.modulo_numero,
          moduloTitulo: q.modulo_titulo,
          codigoPlaca: q.codigo_placa ?? null,
          options: {
            deleteMany: {},
            create: options,
          },
        },
        create: {
          externalId: q.id,
          statement: q.enunciado,
          topic,
          difficulty,
          explanation: q.comentario ?? '',
          moduleNumber: q.modulo_numero,
          moduloTitulo: q.modulo_titulo,
          codigoPlaca: q.codigo_placa ?? null,
          options: {
            create: options,
          },
        },
      })
      processed++
    } catch (err) {
      console.error(`❌ Erro na questão ${q.id}:`, err)
      skipped++
    }

    if (processed % 100 === 0) {
      console.log(`✅ ${processed} questões processadas...`)
    }
  }

  console.log(`\n🎉 Seed concluído!`)
  console.log(`   ✅ Processadas: ${processed}`)
  console.log(`   ⚠️  Ignoradas: ${skipped}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
