import MeterForm from "@/components/MeterForm";

export default function NewMeter() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="display text-2xl">
          Nový měřič
        </h1>
        <p className="section-sub">vyplň název, typ a jednotku</p>
      </header>

      <div>
        <MeterForm />
      </div>
    </div>
  );
}
