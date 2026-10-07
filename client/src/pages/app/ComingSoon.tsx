import { LoopyMascot } from '../../components/LoopyMascot'

export default function ComingSoon({ title }: { title: string }) {
  return (
    <div className="mx-auto flex max-w-[800px] flex-col items-center gap-4 p-6 py-24 text-center md:p-8">
      <LoopyMascot expression="sleepy" size={100} />
      <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
      <p className="text-ink-soft">Loopy todavía está tejiendo este módulo. ¡Ya casi!</p>
    </div>
  )
}
