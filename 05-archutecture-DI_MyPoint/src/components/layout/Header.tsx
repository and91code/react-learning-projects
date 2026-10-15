import useStore from "../../store/useStore";
import { cn } from "../../utils";

export default function Header({ disabled }: { disabled: boolean }) {
  const store = useStore();

  return (
    <header>
      <h1>MyPonint</h1>

      <div className="flex items-center gap-0.5 md:gap-2">
        <select
          className={cn(
            "p-1 md:px-2 md:py-1.5 border border-neutral-300 text-sm rounded",
            disabled && "bg-neutral-100 cursor-not-allowed opacity-50"
          )}
          value={store.state.inputYear}
          onChange={(e) => {
            store.actions.setData({ inputYear: e.target.value });
          }}
          disabled={disabled}
        >
          {years.map(({ value, label }) => (
            <option key={label} value={value}>
              {label}
            </option>
          ))}
        </select>

        <select
          className={cn(
            "p-1 md:px-2 md:py-1.5 border border-neutral-300 text-sm rounded",
            disabled && "bg-neutral-100 cursor-not-allowed opacity-50"
          )}
          value={store.state.inputMonth}
          onChange={(e) => {
            store.actions.setData({ inputMonth: e.target.value });
          }}
          disabled={disabled}
        >
          {months.map(({ value, label }) => (
            <option key={label} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}

const years = [
  // { value: "2023", label: "2023" },
  { value: "2024", label: "2024" },
  { value: "2025", label: "2025" },
  { value: "2026", label: "2026" },
  { value: "2027", label: "2027" },
];

const months = [
  { value: "01", label: "Janeiro" },
  { value: "02", label: "Fevereiro" },
  { value: "03", label: "Março" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Maio" },
  { value: "06", label: "Junho" },
  { value: "07", label: "Julho" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];
