import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SalesClient } from '@/types/sales';
import { processClient } from '@/services/salesApi';
import { useToast } from '@/hooks/use-toast';
import { Search, ArrowUpDown, Loader2 } from 'lucide-react';

interface SalesTableProps {
  data: SalesClient[];
  loading?: boolean;
  onDataChange?: () => void;
}

const columnHelper = createColumnHelper<SalesClient>();

export const SalesTable: React.FC<SalesTableProps> = ({ data, loading = false, onDataChange }) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [processingClients, setProcessingClients] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const handleProcessClient = async (client: SalesClient) => {
    console.log('Processing client:', client.email);
    setProcessingClients(prev => new Set(prev).add(client.id));
    
    try {
      const result = await processClient({
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        phoneNo: client.phoneNo,
        notes: client.notes || ''
      });
      
      if (result.success) {
        toast({
          title: "Processing Initiated!",
          description: `Processing has been initiated for ${client.firstName} ${client.lastName}!`,
          variant: "default",
          className: "success-enter bg-success text-success-foreground",
        });
      } else {
        toast({
          title: "Processing Failed",
          description: result.message || "Failed to process client",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setProcessingClients(prev => {
        const newSet = new Set(prev);
        newSet.delete(client.id);
        return newSet;
      });
    }
  };


  const columns = useMemo(
    () => [
      columnHelper.accessor('firstName', {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="hover:bg-table-row-hover font-semibold"
          >
            First Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ getValue }) => (
          <div className="font-medium text-foreground">{getValue()}</div>
        ),
      }),
      columnHelper.accessor('lastName', {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="hover:bg-table-row-hover font-semibold"
          >
            Last Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ getValue }) => (
          <div className="font-medium text-foreground">{getValue()}</div>
        ),
      }),
      columnHelper.accessor('email', {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="hover:bg-table-row-hover font-semibold"
          >
            Email
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ getValue }) => (
          <div className="text-primary font-medium">{getValue()}</div>
        ),
      }),
      columnHelper.accessor('phoneNo', {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="hover:bg-table-row-hover font-semibold"
          >
            Phone No
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ getValue }) => (
          <div className="text-foreground font-medium">
            {getValue()}
          </div>
        ),
        filterFn: 'includesString',
      }),
      columnHelper.accessor('source', {
        header: 'Source',
        cell: ({ getValue }) => (
          <div className="text-muted-foreground max-w-xs truncate">
            {getValue()}
          </div>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const client = row.original;
          const isProcessing = processingClients.has(client.id);
          
          return (
            <Button
              variant="process"
              size="sm"
              onClick={() => handleProcessClient(client)}
              disabled={isProcessing}
              className="min-w-[120px]"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Process Client'
              )}
            </Button>
          );
        },
      }),
    ],
    [processingClients, toast]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
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
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading sales data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-10 bg-muted border-border"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} of {data.length} clients
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden bg-card shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-table-header">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-4 text-left border-b border-border"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row, index) => (
                <tr
                  key={row.id}
                  className={`table-row border-b border-border last:border-b-0 ${
                    index % 2 === 0 ? 'bg-table-row' : 'bg-card'
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {table.getFilteredRowModel().rows.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No clients found matching your search.
          </div>
        )}
      </div>
    </div>
  );
};