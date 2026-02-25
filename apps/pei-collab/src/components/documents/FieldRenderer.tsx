import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type FieldOption = {
  value: string;
  label: string;
};

type FieldRendererProps = {
  id: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[] | FieldOption[] | null;
  value: string | number | boolean | string[] | null;
  onChange: (value: string | number | boolean | string[] | null) => void;
  readOnly?: boolean;
};

export function FieldRenderer({
  id,
  label,
  type,
  required,
  options,
  value,
  onChange,
  readOnly,
}: FieldRendererProps) {
  const parsedOptions = (options ?? []).map((option) =>
    typeof option === 'string' ? { value: option, label: option } : option
  );

  if (type === 'textarea') {
    return (
      <div className="space-y-2">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
          {required ? ' *' : ''}
        </label>
        <Textarea
          id={id}
          value={(value as string) ?? ''}
          onChange={(event) => onChange(event.target.value)}
          disabled={readOnly}
        />
      </div>
    );
  }

  if (type === 'select') {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium">
          {label}
          {required ? ' *' : ''}
        </label>
        <Select
          value={(value as string) ?? ''}
          onValueChange={(newValue) => onChange(newValue)}
          disabled={readOnly}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {parsedOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (type === 'multiselect') {
    return (
      <div className="space-y-2">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
          {required ? ' *' : ''}
        </label>
        <Input
          id={id}
          value={Array.isArray(value) ? value.join(', ') : ''}
          onChange={(event) =>
            onChange(
              event.target.value
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean)
            )
          }
          placeholder="Separe por vírgula"
          disabled={readOnly}
        />
      </div>
    );
  }

  if (type === 'boolean') {
    return (
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onChange(event.target.checked)}
          disabled={readOnly}
        />
        <label htmlFor={id} className="text-sm font-medium">
          {label}
          {required ? ' *' : ''}
        </label>
      </div>
    );
  }

  if (type === 'date') {
    return (
      <div className="space-y-2">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
          {required ? ' *' : ''}
        </label>
        <Input
          id={id}
          type="date"
          value={(value as string) ?? ''}
          onChange={(event) => onChange(event.target.value)}
          disabled={readOnly}
        />
      </div>
    );
  }

  if (type === 'number') {
    return (
      <div className="space-y-2">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
          {required ? ' *' : ''}
        </label>
        <Input
          id={id}
          type="number"
          value={typeof value === 'number' ? String(value) : ''}
          onChange={(event) => onChange(Number(event.target.value))}
          disabled={readOnly}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {required ? ' *' : ''}
      </label>
      <Input
        id={id}
        value={(value as string) ?? ''}
        onChange={(event) => onChange(event.target.value)}
        disabled={readOnly}
      />
    </div>
  );
}
