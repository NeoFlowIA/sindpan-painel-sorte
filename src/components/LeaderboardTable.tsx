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

interface BakeryRanking {
  position: number;
  name: string;
  coupons: number;
  growth: number;
  status: "active" | "new" | "champion";
}

const mockLeaderboard: BakeryRanking[] = [
  { position: 1, name: "Padaria Central", coupons: 245, growth: 15, status: "champion" },
  { position: 2, name: "Pão Dourado", coupons: 189, growth: 8, status: "active" },
  { position: 3, name: "Bella Vista", coupons: 167, growth: 22, status: "active" },
  { position: 4, name: "São José", coupons: 143, growth: -3, status: "active" },
  { position: 5, name: "Pão Nosso", coupons: 128, growth: 45, status: "new" },
  { position: 6, name: "Vila Nova", coupons: 95, growth: 12, status: "active" },
];

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

const getStatusBadge = (status: BakeryRanking["status"]) => {
  switch (status) {
    case "champion":
      return <Badge variant="default" className="bg-accent text-accent-foreground">Campeão</Badge>;
    case "new":
      return <Badge variant="secondary">Novo</Badge>;
    default:
      return null;
  }
};

export function LeaderboardTable() {
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
              <TableHead className="text-right">Crescimento</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockLeaderboard.map((bakery) => (
              <TableRow key={bakery.position} className="hover:bg-muted/50">
                <TableCell className="font-medium">
                  {getRankIcon(bakery.position)}
                </TableCell>
                <TableCell className="font-medium">{bakery.name}</TableCell>
                <TableCell className="text-right font-bold text-primary">
                  {bakery.coupons.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={`font-medium ${
                      bakery.growth >= 0 ? "text-success" : "text-destructive"
                    }`}
                  >
                    {bakery.growth >= 0 ? "+" : ""}{bakery.growth}%
                  </span>
                </TableCell>
                <TableCell>
                  {getStatusBadge(bakery.status)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}