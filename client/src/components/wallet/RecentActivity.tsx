import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";

interface RecentActivityProps {
  type: "activity" | "operations";
  onDeposit?: (symbol?: string) => void;
}

const FilterItem = ({ label, value, isPrimary = false }: { label: string; value: string; isPrimary?: boolean }) => (
  <div className="flex items-center gap-1.5 bg-muted/10 px-3 py-1.5 rounded-md border border-muted/50 cursor-pointer hover:bg-muted/20">
    <span className="text-muted-foreground font-medium">{label}:</span>
    <span className={`font-semibold ${isPrimary ? "text-primary" : ""}`}>{value}</span>
    <MoreHorizontal className="h-3 w-3 rotate-90 ml-1" />
  </div>
);

const ActivityTable = ({ isOperations, onDeposit }: { isOperations: boolean; onDeposit?: (symbol?: string) => void }) => (
  <div className="rounded-lg border bg-card dark:bg-card/50 overflow-x-auto no-scrollbar">
    <Table className="min-w-full">
      <TableHeader className="bg-transparent border-b">
        <TableRow className="hover:bg-transparent border-none">
          <TableHead className="text-[10px] sm:text-xs font-medium text-muted-foreground py-4">Type</TableHead>
          <TableHead className="text-[10px] sm:text-xs font-medium text-muted-foreground py-4 text-center">Asset</TableHead>
          <TableHead className="text-[10px] sm:text-xs font-medium text-muted-foreground py-4 text-center">Amount</TableHead>
          {isOperations ? (
            <TableHead className="text-[10px] sm:text-xs font-medium text-muted-foreground py-4 text-right">Date</TableHead>
          ) : (
            <>
              <TableHead className="text-[10px] sm:text-xs font-medium text-muted-foreground py-4 text-center">Date</TableHead>
              <TableHead className="text-[10px] sm:text-xs font-medium text-muted-foreground py-4 text-right">Status</TableHead>
            </>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow className="hover:bg-transparent border-none">
          <TableCell colSpan={isOperations ? 4 : 5} className="py-20 text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 rounded-lg bg-muted/10 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-muted-foreground/30 rounded-sm flex items-center justify-center">
                  <div className="w-2 h-2 bg-muted-foreground/30 rounded-full" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-base font-bold text-muted-foreground">Nothing to show yet</p>
                <p className="text-xs text-muted-foreground/60 max-w-[300px] mx-auto">
                  {isOperations 
                    ? "No results match your current filters. Adjust the filters and try again."
                    : "You currently have no assets deposited in your NoOnes wallet"}
                </p>
              </div>
              {!isOperations && (
                <Button 
                  onClick={() => onDeposit?.()}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 rounded-lg transition-all"
                >
                  Deposit
                </Button>
              )}
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
);

export function RecentActivity({ type, onDeposit }: RecentActivityProps) {
  const isOperations = type === "operations";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="font-bold text-foreground mr-1">Filter</span>
        
        {isOperations ? (
          <>
            <FilterItem label="Transactions" value="All" />
            <FilterItem label="Action" value="All" />
            <FilterItem label="Date" value="Past 7 days" isPrimary />
          </>
        ) : (
          <>
            <FilterItem label="Asset" value="All" />
            <FilterItem label="Type" value="All" />
            <FilterItem label="Status" value="All" />
            <FilterItem label="Date" value="From the beginning" isPrimary />
          </>
        )}
      </div>

      <ActivityTable isOperations={isOperations} onDeposit={onDeposit} />
    </div>
  );
}
