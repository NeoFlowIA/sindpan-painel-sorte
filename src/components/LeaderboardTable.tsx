import { useState } from "react";
import { Trophy, Medal, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { differenceInDays, endOfDay, startOfDay } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql-client";
import { GET_PADARIAS_RANKING } from "@/graphql/queries";
import { DateRange } from "react-day-picker";

const getRankIcon = (position: number) => {
  switch (position) {
    case 1:
      return <Trophy className="w-5 h-5 text-accent" />;
    case 2:
      return <Medal className="w-5 h-5 text-muted-foreground" />;
    case 3:
      return <Award className="w-5 h-5 text-secondary" />;
    default:
      return <span className="text-sm font-medium text-muted-foreground">#{position}</span>;
  }
};

const getStatusBadge = (status: string, position: number) => {
  // Mostrar status do Hasura com estilo especial para campeão
  if (position === 1) {
    return <Badge variant="default" className="bg-accent text-accent-foreground">🏆 Campeão</Badge>;
  }
  
  // Mostrar status do Hasura
  if (status === "ativa") {
    return <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">Ativa</Badge>;
  } else if (status === "inativa") {
    return <Badge variant="outline" className="text-muted-foreground">Inativa</Badge>;
  } else if (status === "pendente") {
    return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Pendente</Badge>;
  }
  
  return <Badge variant="outline">{status}</Badge>;
};

type LeaderboardTableProps = {
  dateRange?: DateRange;
};

export function LeaderboardTable({ dateRange }: LeaderboardTableProps) {
  const [showAll, setShowAll] = useState(false);
  const startDate = dateRange?.from ? startOfDay(dateRange.from).toISOString() : null;
  const endDate = dateRange?.to
    ? endOfDay(dateRange.to).toISOString()
    : dateRange?.from
      ? endOfDay(dateRange.from).toISOString()
      : null;

  // Buscar ranking de padarias
  const { data: rankingData, isLoading } = useQuery({
    queryKey: ['padarias-ranking-table', showAll, startDate, endDate],
    queryFn: async () => {
      const data = await graphqlClient.query<{
        padarias: Array<{
          id: string;
          nome: string;
          status: string;
          cupons_aggregate: { aggregate: { count: number } };
          cupons: Array<{
            numero_sorte: string;
            data_compra: string;
          }>;
        }>;
      }>(GET_PADARIAS_RANKING, {
        limit: showAll ? undefined : 10,
        startDate,
        endDate,
      });
      return data;
    },
    refetchInterval: 60000, // Atualiza a cada 1 minuto
  });

  // Padarias já vêm ordenadas do Hasura
  const leaderboard = (rankingData?.padarias || []).map((padaria, index) => ({
    position: index + 1,
    name: padaria.nome,
    coupons: padaria.cupons_aggregate.aggregate.count,
    ultimoCupomNumero: padaria.cupons[0]?.numero_sorte || null,
    ultimoCupomData: padaria.cupons[0]?.data_compra || null,
    status: padaria.status
  }));

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Trophy className="w-5 h-5 text-accent" />
            Ranking das Padarias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px]" />
        </CardContent>
      </Card>
    );
  }

  const displayed = showAll
    ? leaderboard
    : leaderboard.slice(0, 10);

  const canShowMore = !showAll && leaderboard.length >= 10;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Trophy className="w-5 h-5 text-accent" />
          Ranking das Padarias
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Pos.</TableHead>
              <TableHead>Padaria</TableHead>
              <TableHead className="text-right">Cupons</TableHead>
              <TableHead className="text-right">Último Cupom</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayed.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Nenhuma padaria encontrada
                </TableCell>
              </TableRow>
            ) : (
              displayed.map((bakery) => (
                <TableRow key={bakery.position} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    {getRankIcon(bakery.position)}
                  </TableCell>
                  <TableCell className="font-medium">{bakery.name}</TableCell>
                  <TableCell className="text-right font-bold text-primary">
                    {bakery.coupons.toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">
                    {bakery.ultimoCupomNumero ? (
                      <div className="flex flex-col items-end">
                        <span className="font-mono font-bold text-primary">
                          {bakery.ultimoCupomNumero}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {bakery.ultimoCupomData 
                            ? `${differenceInDays(new Date(), new Date(bakery.ultimoCupomData))}d atrás`
                            : ''
                          }
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Sem cupons</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(bakery.status, bakery.position)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {canShowMore && (
          <div className="mt-4 flex justify-center">
            <Button variant="outline" onClick={() => setShowAll(true)}>
              Mais
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}