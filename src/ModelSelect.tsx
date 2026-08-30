import { MODEL_OPTIONS } from "./proofread/models";

export function ModelSelect({
  model,
  onChange,
}: {
  model: string;
  onChange: (value: string) => void;
}) {
  const known = MODEL_OPTIONS.some((option) => option.id === model);
  return (
    <label className="model-select">
      Modell
      <select
        className="model-input"
        value={model}
        onChange={(event) => onChange(event.target.value)}
      >
        {MODEL_OPTIONS.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
        {!known && <option value={model}>{model}</option>}
      </select>
    </label>
  );
}
