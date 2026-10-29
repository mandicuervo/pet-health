import { DecimalPipe, DOCUMENT } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Food, FoodCategory } from '../../../core/models/food.model';
import { HealthEntry } from '../../../core/models/health-entry.model';
import { MealEvent } from '../../../core/models/meal-event.model';
import { PetData } from '../../../core/services/pet-data';
import { localDateKey } from '../../../core/utils/date';

interface DiaryDate {
  key: string;
  date: Date;
  dayNumber: number;
  weekday: string;
  inCurrentMonth: boolean;
  hasRecords: boolean;
}

type DiaryRecordType = FoodCategory | HealthEntry['type'] | 'weight';
type RecordFilter = 'all' | 'bloodGlucose' | 'insulin' | 'medication' | 'food' | 'weight';

interface DiaryRecord {
  id: string;
  type: DiaryRecordType;
  occurredAt: string;
  dateKey: string;
  time?: string;
  title: string;
  titleKey?: string;
  detail: string;
  foodCategory?: FoodCategory;
  calories?: number;
  notes?: string;
}

interface DiaryRecordGroup {
  key: string;
  label: string;
  records: DiaryRecord[];
}

interface GlucosePoint {
  label: string;
  value: number;
  x: number;
  y: number;
  barHeight: number;
}

interface WeightPoint {
  label: string;
  value?: number;
  x: number;
  y: number;
}

@Component({
  imports: [DecimalPipe, RouterLink, TranslatePipe],
  selector: 'app-food-diary-page',
  styleUrl: './food-diary-page.scss',
  templateUrl: './food-diary-page.html',
})
export class FoodDiaryPage {
  private readonly petData = inject(PetData);
  private readonly document = inject(DOCUMENT);
  readonly pet = this.petData.pet;
  readonly selectedDate = signal(localDateKey(new Date()));
  readonly monthlyView = signal(false);
  readonly recordFilter = signal<RecordFilter>('all');
  readonly trendPeriod = signal<'week' | 'month'>('week');

  readonly weekDates = computed(() => {
    const selected = this.parseDate(this.selectedDate());
    const start = new Date(selected);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return this.toDiaryDate(date, true);
    });
  });

  readonly monthDates = computed(() => {
    const selected = this.parseDate(this.selectedDate());
    const monthStart = new Date(selected.getFullYear(), selected.getMonth(), 1, 12);
    const start = new Date(monthStart);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    const monthEnd = new Date(selected.getFullYear(), selected.getMonth() + 1, 0, 12);
    const end = new Date(monthEnd);
    end.setDate(end.getDate() + (6 - ((end.getDay() + 6) % 7)));
    const dates: DiaryDate[] = [];

    for (const date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      dates.push(
        this.toDiaryDate(
          new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12),
          date.getMonth() === selected.getMonth(),
        ),
      );
    }

    return dates;
  });

  readonly monthLabel = computed(() =>
    this.parseDate(this.selectedDate()).toLocaleDateString(this.locale(), {
      month: 'long',
      year: 'numeric',
    }),
  );

  readonly records = computed<DiaryRecord[]>(() => {
    const foodsById = new Map(this.petData.foods().map((food) => [food.id, food]));
    const meals = this.petData
      .mealEvents()
      .filter((event) => event.petId === this.pet().id)
      .map((event) => this.toDiaryMeal(event, foodsById));
    const healthEntries = this.petData
      .healthEntries()
      .filter((entry) => entry.petId === this.pet().id)
      .map((entry) => this.toDiaryHealthRecord(entry));
    const weightEntries = this.petData
      .weightEntries()
      .filter((entry) => entry.petId === this.pet().id)
      .map((entry): DiaryRecord => ({
        id: entry.id,
        type: 'weight',
        occurredAt: `${entry.date}T12:00:00`,
        dateKey: entry.date,
        titleKey: 'records.weight',
        title: '',
        detail: `${entry.weightKg} kg`,
      }));

    return [...meals, ...healthEntries, ...weightEntries].sort((a, b) =>
      b.occurredAt.localeCompare(a.occurredAt),
    );
  });

  readonly filteredRecords = computed(() => {
    const filter = this.recordFilter();
    const range = this.selectedRange();
    return this.records().filter((record) => {
      if (record.dateKey < range.start || record.dateKey > range.end) {
        return false;
      }
      if (filter === 'all') {
        return true;
      }
      if (filter === 'food') {
        return record.foodCategory !== undefined;
      }
      return record.type === filter;
    });
  });

  readonly recordGroups = computed<DiaryRecordGroup[]>(() => {
    const groups = new Map<string, DiaryRecord[]>();
    for (const record of this.filteredRecords()) {
      const entries = groups.get(record.dateKey) ?? [];
      entries.push(record);
      groups.set(record.dateKey, entries);
    }

    return [...groups.entries()].map(([key, records]) => ({
      key,
      label: this.groupLabel(key),
      records,
    }));
  });

  readonly selectedDayCalories = computed(() =>
    this.records()
      .filter(
        (record) =>
          record.dateKey === this.selectedDate() && record.foodCategory !== undefined,
      )
      .reduce((total, record) => total + (record.calories ?? 0), 0),
  );
  readonly calorieProgress = computed(() => {
    const target = this.pet().dailyKcalTarget;
    return target === undefined || target <= 0
      ? 0
      : Math.min(100, (this.selectedDayCalories() / target) * 100);
  });
  readonly remainingCalories = computed<number | undefined>(() => {
    const target = this.pet().dailyKcalTarget;
    return target === undefined
      ? undefined
      : Math.max(0, target - this.selectedDayCalories());
  });

  readonly glucosePoints = computed<GlucosePoint[]>(() => {
    const points = this.trendPeriod() === 'week' ? this.weekGlucosePoints() : this.monthGlucosePoints();
    const values = points.map((point) => point.value).filter((value): value is number => value !== undefined);
    if (values.length === 0) {
      return [];
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = Math.max((max - min) * 0.2, max * 0.08, 10);
    const domainMin = Math.max(0, min - padding);
    const domainRange = max + padding - domainMin;
    const chartTop = 12;
    const chartBottom = 94;
    const chartHeight = chartBottom - chartTop;
    const slotWidth = 280 / points.length;

    return points.map((point, index) => {
      const x = 20 + slotWidth * index + slotWidth / 2;
      const normalized =
        point.value === undefined ? 0 : (point.value - domainMin) / domainRange;
      const y = chartBottom - normalized * chartHeight;
      const barHeight = point.value === undefined ? 0 : Math.max(4, normalized * chartHeight);
      return { label: point.label, value: point.value ?? 0, x, y, barHeight };
    });
  });

  readonly glucoseLine = computed(() =>
    this.glucosePoints()
      .filter((point) => point.value > 0)
      .map((point) => `${point.x},${point.y}`)
      .join(' '),
  );

  readonly weightPoints = computed<WeightPoint[]>(() => {
    const entries = this.petData
      .weightEntries()
      .filter((entry) => entry.petId === this.pet().id)
      .sort((a, b) => a.date.localeCompare(b.date));
    const data =
      this.trendPeriod() === 'week'
        ? this.weekDates().map((date) => {
            const entry = entries.filter((item) => item.date === date.key).at(-1);
            return { label: date.weekday, value: entry?.weightKg };
          })
        : this.monthlyWeightData(entries);
    const values = data
      .map((point) => point.value)
      .filter((value): value is number => value !== undefined);
    if (values.length === 0) {
      return [];
    }

    const minimum = Math.min(...values);
    const maximum = Math.max(...values);
    const padding = Math.max((maximum - minimum) * 0.2, 0.1);
    const domainMinimum = minimum - padding;
    const domainRange = maximum - minimum + padding * 2;
    const chartTop = 12;
    const chartBottom = 92;

    return data.map((point, index) => ({
      ...point,
      x: data.length === 1 ? 160 : 20 + (280 * index) / (data.length - 1),
      y:
        point.value === undefined
          ? chartBottom
          : chartBottom -
            ((point.value - domainMinimum) / domainRange) * (chartBottom - chartTop),
    }));
  });

  readonly weightLine = computed(() =>
    this.weightPoints()
      .filter((point) => point.value !== undefined)
      .map((point) => `${point.x},${point.y}`)
      .join(' '),
  );

  selectDate(date: string): void {
    this.selectedDate.set(date);
  }

  shiftMonth(amount: number): void {
    const date = this.parseDate(this.selectedDate());
    const day = date.getDate();
    date.setDate(1);
    date.setMonth(date.getMonth() + amount);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0, 12).getDate();
    date.setDate(Math.min(day, lastDay));
    this.selectedDate.set(localDateKey(date));
  }

  toggleView(): void {
    this.monthlyView.update((visible) => !visible);
  }

  selectFilter(filter: RecordFilter): void {
    this.recordFilter.set(filter);
  }

  setTrendPeriod(period: 'week' | 'month'): void {
    this.trendPeriod.set(period);
  }

  formatDate(date: Date, options: Intl.DateTimeFormatOptions): string {
    return date.toLocaleDateString(this.locale(), options);
  }

  foodTypeKey(category: FoodCategory): string {
    return `dashboard.foodTypes.${category}`;
  }

  private toDiaryMeal(event: MealEvent, foodsById: Map<string, Food>): DiaryRecord {
    const food = foodsById.get(event.foodId);
    if (!food) {
      throw new Error(`Food ${event.foodId} not found for meal ${event.id}`);
    }

    return {
      id: event.id,
      type: event.type === 'treat' ? 'treat' : food.category,
      occurredAt: event.eatenAt,
      dateKey: localDateKey(new Date(event.eatenAt)),
      time: this.formatTime(event.eatenAt),
      title: food.name,
      detail: `${event.grams} g`,
      foodCategory: event.type === 'treat' ? 'treat' : food.category,
      calories: (event.grams * food.kcalPerKg) / 1000,
      notes: event.notes?.trim() || undefined,
    };
  }

  private toDiaryHealthRecord(entry: HealthEntry): DiaryRecord {
    const occurredAt = this.healthEntryTime(entry);
    const detail =
      entry.type === 'bloodGlucose'
        ? `${entry.valueMgDl} mg/dL`
        : entry.type === 'insulin'
          ? `${entry.doseUnits} UI`
          : `${entry.doseAmount} ${entry.doseUnit}`;

    return {
      id: entry.id,
      type: entry.type,
      occurredAt,
      dateKey: localDateKey(new Date(occurredAt)),
      time: this.formatTime(occurredAt),
      title: entry.type === 'medication' ? entry.medicationName : '',
      titleKey: `records.${entry.type}`,
      detail,
      notes: entry.notes?.trim() || undefined,
    };
  }

  private healthEntryTime(entry: HealthEntry): string {
    return 'measuredAt' in entry ? entry.measuredAt : entry.administeredAt;
  }

  private formatTime(dateTime: string): string {
    return new Date(dateTime).toLocaleTimeString(this.locale(), {
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
  }

  private toDiaryDate(date: Date, inCurrentMonth: boolean): DiaryDate {
    const key = localDateKey(date);
    const hasMeals = this.petData
      .mealEvents()
      .some(
        (event) => event.petId === this.pet().id && localDateKey(new Date(event.eatenAt)) === key,
      );
    const hasHealthEntries = this.petData
      .healthEntries()
      .some(
        (entry) =>
          entry.petId === this.pet().id &&
          localDateKey(new Date(this.healthEntryTime(entry))) === key,
      );
    const hasWeightEntries = this.petData
      .weightEntries()
      .some((entry) => entry.petId === this.pet().id && entry.date === key);

    return {
      key,
      date,
      dayNumber: date.getDate(),
      weekday: date.toLocaleDateString(this.locale(), { weekday: 'short' }),
      inCurrentMonth,
      hasRecords: hasMeals || hasHealthEntries || hasWeightEntries,
    };
  }

  private parseDate(date: string): Date {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day, 12);
  }

  private selectedRange(): { start: string; end: string } {
    const selected = this.parseDate(this.selectedDate());
    if (this.monthlyView()) {
      return {
        start: localDateKey(new Date(selected.getFullYear(), selected.getMonth(), 1, 12)),
        end: localDateKey(new Date(selected.getFullYear(), selected.getMonth() + 1, 0, 12)),
      };
    }

    const start = new Date(selected);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start: localDateKey(start), end: localDateKey(end) };
  }

  private groupLabel(key: string): string {
    const date = this.parseDate(key);
    const today = localDateKey(new Date());
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = localDateKey(yesterdayDate);
    if (key === today) {
      return 'foodDiary.today';
    }
    if (key === yesterday) {
      return 'foodDiary.yesterday';
    }
    return date.toLocaleDateString(this.locale(), { weekday: 'long', day: 'numeric', month: 'long' });
  }

  private weekGlucosePoints(): { label: string; value?: number }[] {
    return this.weekDates().map((date) => {
      const entries = this.petData.healthEntries().filter(
        (entry) =>
          entry.petId === this.pet().id &&
          entry.type === 'bloodGlucose' &&
          localDateKey(new Date(entry.measuredAt)) === date.key,
      );
      const value =
        entries.length > 0
          ? entries.reduce((sum, entry) => sum + (entry.type === 'bloodGlucose' ? entry.valueMgDl : 0), 0) /
            entries.length
          : undefined;
      return { label: date.weekday, value };
    });
  }

  private monthGlucosePoints(): { label: string; value?: number }[] {
    const selected = this.parseDate(this.selectedDate());
    return Array.from({ length: 6 }, (_, index) => {
      const month = new Date(selected.getFullYear(), selected.getMonth() - 5 + index, 1, 12);
      const key = localDateKey(month).slice(0, 7);
      const entries = this.petData.healthEntries().filter(
        (entry) =>
          entry.petId === this.pet().id &&
          entry.type === 'bloodGlucose' &&
          localDateKey(new Date(entry.measuredAt)).startsWith(key),
      );
      const value =
        entries.length > 0
          ? entries.reduce((sum, entry) => sum + (entry.type === 'bloodGlucose' ? entry.valueMgDl : 0), 0) /
            entries.length
          : undefined;
      return {
        label: month.toLocaleDateString(this.locale(), { month: 'short' }),
        value,
      };
    });
  }

  private monthlyWeightData(
    entries: { date: string; weightKg: number }[],
  ): { label: string; value?: number }[] {
    const selected = this.parseDate(this.selectedDate());
    const start = new Date(selected.getFullYear(), selected.getMonth() - 5, 1, 12);
    const startKey = localDateKey(start);
    const end = new Date(selected.getFullYear(), selected.getMonth() + 1, 0, 12);
    const endKey = localDateKey(end);

    return entries
      .filter((entry) => entry.date >= startKey && entry.date <= endKey)
      .map((entry) => ({
        label: this.parseDate(entry.date).toLocaleDateString(this.locale(), {
          month: 'short',
          day: 'numeric',
        }),
        value: entry.weightKg,
      }));
  }

  private locale(): string {
    return this.document.documentElement.lang || 'pt-BR';
  }
}
