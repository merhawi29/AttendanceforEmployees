"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardStats } from "@/types";
import { Users, UserCheck, UserX, Clock, UtensilsCrossed } from "lucide-react";

interface StatsCardsProps {
  stats: DashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const calcPercent = (val: number) => {
    if (stats.totalEmployees <= 0) return "0%";
    return `${Math.round((val / stats.totalEmployees) * 100)}%`;
  };

  const cards = [
    {
      title: "Total Employees",
      value: stats.totalEmployees,
      display: String(stats.totalEmployees),
      icon: Users,
      color: "text-blue-600 bg-blue-50 border border-blue-100",
    },
    {
      title: "Present Today",
      value: stats.presentToday,
      display: `${stats.presentToday} / ${stats.totalEmployees} (${calcPercent(stats.presentToday)})`,
      icon: UserCheck,
      color: "text-green-600 bg-green-50 border border-green-100",
    },
    {
      title: "Absent Today",
      value: stats.absentToday,
      display: `${stats.absentToday} / ${stats.totalEmployees} (${calcPercent(stats.absentToday)})`,
      icon: UserX,
      color: "text-red-600 bg-red-50 border border-red-100",
    },
    {
      title: "Late Today",
      value: stats.lateToday,
      display: `${stats.lateToday} / ${stats.totalEmployees} (${calcPercent(stats.lateToday)})`,
      icon: Clock,
      color: "text-orange-600 bg-orange-50 border border-orange-100",
    },
    {
      title: "Lunch Missing",
      value: stats.lunchMissingToday,
      display: `${stats.lunchMissingToday} / ${stats.totalEmployees} (${calcPercent(stats.lunchMissingToday)})`,
      icon: UtensilsCrossed,
      color: "text-purple-600 bg-purple-50 border border-purple-100",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">{card.title}</CardTitle>
              <div className={`rounded-lg p-2 ${card.color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-gray-900 tracking-tight">{card.display}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
