import MeterForm from "@/components/MeterForm";

export default function NewMeter() {
  return (
    <div className="space-y-8 max-w-xl mx-auto">
      <header className="space-y-3 text-center">
        <h1 className="display" style={{ fontSize: "2.4rem" }}>
          Nový měřič
        </h1>
        <p className="section-sub">vyplň název, typ a jednotku</p>
      </header>

      <div className="card" style={{ padding: "2rem 2.25rem" }}>
        <MeterForm />
      </div>
    </div>
  );
}
