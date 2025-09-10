import React, { useMemo, useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SalesRep } from '@/types/salesRep';
import { updateSalesRep } from '@/services/salesRepService';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserCheck, UserX } from 'lucide-react';

interface SalesRepTableProps {
  data: SalesRep[];
  loading?: boolean;
  onDataChange?: () => void;
}

export const SalesRepTable = ({ data, loading, onDataChange }: SalesRepTableProps) => {
  const { toast } = useToast();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState<Set<string>>(new Set());

  const columnHelper = createColumnHelper<SalesRep>();

  const handleStatusToggle = async (repId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    setUpdatingStatus(prev => new Set(prev).add(repId));
    
    try {
      const result = await updateSalesRep(repId, { status: newStatus });
      
      if (result.success) {
        toast({
          title: 'Success',
          description: `Sales rep ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
        });
        onDataChange?.();
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to update status',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    } finally {
      setUpdatingStatus(prev => {
        const newSet = new Set(prev);
        newSet.delete(repId);
        return newSet;
      });
    }
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('first_name', {
        header: 'First Name',
        cell: info => info.getValue(),
      }),
      columnHelper.accessor('last_name', {
        header: 'Last Name',
        cell: info => info.getValue(),
      }),
      columnHelper.accessor('email', {
        header: 'Email',
        cell: info => info.getValue(),
      }),
      columnHelper.accessor('phone_no', {
        header: 'Phone',
        cell: info => info.getValue() || '-',
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: info => (
          <Badge variant={info.getValue() === 'active' ? 'default' : 'secondary'}>
            {info.getValue()}
          </Badge>
        ),
      }),
      columnHelper.accessor('created_at', {
        header: 'Created',
        cell: info => new Date(info.getValue()).toLocaleDateString(),
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: info => {
          const rep = info.row.original;
          const isUpdating = updatingStatus.has(rep.id);
          
          return (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusToggle(rep.id, rep.status)}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : rep.status === 'active' ? (
                <>
                  <UserX className="h-4 w-4 mr-1" />
                  Deactivate
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4 mr-1" />
                  Activate
                </>
              )}
            </Button>
          );
        },
      }),
    ],
    [columnHelper, updatingStatus, onDataChange, toast]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading sales representatives...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Input
          placeholder="Search sales reps..."
          value={globalFilter ?? ''}
          onChange={event => setGlobalFilter(String(event.target.value))}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="border-b bg-muted/50">
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index) => (
                <tr
                  key={row.id}
                  className={`border-b transition-colors hover:bg-muted/50 ${
                    index % 2 === 0 ? 'bg-background' : 'bg-muted/25'
                  }`}
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="p-4 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="h-24 text-center">
                  No sales representatives found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};