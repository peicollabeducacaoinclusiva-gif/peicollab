import * as React from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../table';
import { cn } from '../../lib/utils';

interface AccessibleTableProps {
  columns: Array<{ key: string; label: string; 'aria-label'?: string }>;
  data: Array<Record<string, React.ReactNode>>;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  className?: string;
  rowKey?: (row: Record<string, React.ReactNode>, index: number) => string;
}

export const AccessibleTable: React.FC<AccessibleTableProps> = ({
  columns,
  data,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  className,
  rowKey,
}) => {
  return (
    <div className="overflow-x-auto">
      <Table
        className={cn(className)}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        role="table"
      >
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.key}
                scope="col"
                aria-label={column['aria-label'] || column.label}
              >
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow
              key={rowKey ? rowKey(row, index) : index}
              role="row"
            >
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  role="cell"
                  aria-label={column['aria-label'] || `${column.label}: ${row[column.key]}`}
                >
                  {row[column.key]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

