# HRV Optimization App - Implementation Plan

**Stack**: React Native + TypeScript + Expo
**Methodology**: Tracer Bullets (thin end-to-end slices)
**Platform**: iOS/Android (Mac development)

---

## Research Summary

### What is HRV?
Heart Rate Variability (HRV) measures the variation in time between successive heartbeats. It reflects autonomic nervous system (ANS) function - higher HRV generally indicates better cardiovascular health, stress resilience, and recovery capacity.

### Why HRV Matters
- Lower HRV associated with 2.27x higher risk of all-cause death in cardiovascular patients
- Higher HRV indicates effective adaptation and optimal functioning of autonomic mechanisms
- Athletes typically have higher HRV, correlating with better performance and recovery

### Normal HRV Ranges by Age/Gender (RMSSD in ms)

| Age Group | Males (Median) | Females (Median) |
|-----------|----------------|------------------|
| 20-25     | 50-100         | 45-90            |
| 25-35     | 60-78          | 55-70            |
| 35-45     | 48-60          | 45-55            |
| 45-55     | 35-60          | 30-55            |
| 55+       | 30-44          | 28-42            |

**Key insight**: HRV decreases significantly between ages 20-40, especially in men. Gender differences diminish after age 50.

### Scientifically Proven HRV Improvement Interventions

#### Tier 1 - Strong Evidence
1. **Sleep Quality** - Foundation for HRV; sleep deprivation leads to SNS dominance
2. **Resonance Breathing** - 5.5-6 breaths/min for 6+ min/day significantly improves HRV
3. **Regular Exercise** - Moderate-intensity training improves autonomic balance
4. **Meditation** - 20 min/day of meditation shown to increase HRV

#### Tier 2 - Good Evidence
5. **Cold Exposure** - Stimulates vagal tone
6. **Sunlight/Vitamin D** - Modulates circadian rhythm, reduces inflammation
7. **Social Connection** - Blue Zone research shows belonging improves HRV
8. **Alcohol Reduction** - Alcohol significantly depresses HRV

#### Tier 3 - Emerging Evidence
9. **Yoga** - 60 min/week showed significant HRV improvement in studies
10. **Time-Restricted Eating** - Supports circadian rhythm
11. **Hydration** - Dehydration stresses autonomic system

### WHOOP Integration Options

1. **Manual Data Export** - CSV/Excel exports with metrics, recovery, workouts, journal
2. **Official WHOOP API** - Requires developer account and app approval
   - Endpoints: Recovery, Sleep, Workouts, Cycles
   - HRV metric: RMSSD (different from Apple Health's SDNN)
3. **Third-Party APIs** - Spike API, Thryve, Terra - provide normalized WHOOP data

### Competitive Landscape

| App | Strengths | Gaps |
|-----|-----------|------|
| HRV4Training | Correlations, training focus | Not habit-focused |
| Elite HRV | Deep analytics, exports | Complex UX |
| Thryve | AI analysis, time-lag correlations | New, limited track record |
| Bearable | Habit tracking, correlations | Not HRV-specialized |
| WHOOP native | Best WHOOP integration | Limited habit tracking |

---

## App Design

### Target User
- Health-conscious individuals using WHOOP (or similar wearables)
- Want to improve HRV but don't know which habits actually matter for THEM
- Willing to pay for personalized, data-driven guidance

### Core Value Proposition
**"Discover which habits actually improve YOUR HRV and get a personalized plan to reach above-average scores for your age."**

---

## Technical Implementation Plan

### Tech Stack
```
Frontend:     React Native + Expo (TypeScript)
State:        Zustand (simple, fast)
Storage:      AsyncStorage (local) → Supabase (cloud later)
Charts:       Victory Native or React Native Chart Kit
Navigation:   Expo Router
Testing:      Jest + React Native Testing Library
```

### Project Structure
```
hrv-app/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigation
│   │   ├── dashboard.tsx  # Main HRV dashboard
│   │   ├── habits.tsx     # Daily habit logging
│   │   ├── insights.tsx   # Correlations & recommendations
│   │   └── profile.tsx    # Settings, age/gender, goals
│   ├── import.tsx         # WHOOP data import
│   └── _layout.tsx        # Root layout
├── components/            # Reusable components
├── lib/                   # Business logic
│   ├── hrv/              # HRV calculations & benchmarks
│   ├── habits/           # Habit definitions & tracking
│   ├── correlations/     # Statistical analysis
│   └── whoop/            # WHOOP data parsing
├── stores/               # Zustand state stores
├── types/                # TypeScript interfaces
└── constants/            # HRV benchmarks, habit definitions
```

---

## Task Graph & Test Specifications

---

## TASK DEPENDENCY GRAPH

```
                    ┌─────────────────────────────────────────────────────────────┐
                    │                         MILESTONE 4                          │
                    │                    "Improve My HRV"                          │
                    │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐         │
                    │  │ T4.1    │──│ T4.2    │  │ T4.3    │  │ T4.4    │         │
                    │  │ Rec     │  │ Plans   │  │ Goals   │  │ Achieve │         │
                    │  │ Engine  │  │         │  │         │  │ ments   │         │
                    │  └────┬────┘  └─────────┘  └────┬────┘  └─────────┘         │
                    └───────┼─────────────────────────┼───────────────────────────┘
                            │                         │
                    ┌───────┴─────────────────────────┴───────────────────────────┐
                    │                         MILESTONE 3                          │
                    │                 "Understand My Patterns"                     │
                    │  ┌─────────┐  ┌─────────┐  ┌─────────┐                       │
                    │  │ T3.1    │──│ T3.2    │──│ T3.3    │                       │
                    │  │ Corr    │  │ Analysis│  │ Insights│                       │
                    │  │ Engine  │  │         │  │ UI      │                       │
                    │  └────┬────┘  └─────────┘  └─────────┘                       │
                    └───────┼─────────────────────────────────────────────────────┘
                            │
          ┌─────────────────┴─────────────────┐
          │                                   │
┌─────────┴───────────────────────┐  ┌───────┴─────────────────────────────────────┐
│         MILESTONE 2             │  │                  MILESTONE 1                 │
│       "Log My Habits"           │  │                "See My HRV"                  │
│  ┌─────────┐  ┌─────────┐       │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐      │
│  │ T2.1    │──│ T2.2    │       │  │  │ T1.2    │──│ T1.3    │──│ T1.4    │      │
│  │ Habit   │  │ Habit   │       │  │  │ Profile │  │ Import  │  │ Dash    │      │
│  │ Model   │  │ UI      │       │  │  │         │  │         │  │ board   │      │
│  └────┬────┘  └────┬────┘       │  │  └────┬────┘  └─────────┘  └─────────┘      │
│       │            │            │  │       │                                      │
│  ┌────┴────┐  ┌────┴────┐       │  │       │                                      │
│  │ T2.3    │  │ T2.4    │       │  │       │                                      │
│  │ History │  │ Dash    │       │  │       │                                      │
│  │         │  │ Integr  │       │  │       │                                      │
│  └─────────┘  └─────────┘       │  │       │                                      │
└─────────────────────────────────┘  │       │                                      │
                                     │  ┌────┴────┐                                 │
                                     │  │ T1.1    │                                 │
                                     │  │ Project │                                 │
                                     │  │ Setup   │                                 │
                                     │  └─────────┘                                 │
                                     └─────────────────────────────────────────────┘

LEGEND:
  ─── : depends on (arrow points to dependency)
  T1.1 → T1.2 → T1.3 → T1.4 : Sequential within M1
  T2.1 → T2.2, T2.1 → T2.3, T2.2 → T2.4 : T2.4 depends on T2.2
  T3.1 → T3.2 → T3.3 : Sequential within M3
  M3 depends on both M1 and M2 being complete
  M4 depends on M3 being complete
```

---

## FEATURE: See My HRV (Milestone 1)

### BDD Specification

```gherkin
Feature: HRV Data Visualization
  As a WHOOP user
  I want to import my data and see my HRV trend
  So that I can understand my HRV relative to my age/gender

  Background:
    Given I am a 35-year-old male user
    And the HRV benchmark for my demographic is 48ms (50th percentile)

  Scenario: First-time user onboarding
    Given I open the app for the first time
    When I complete the onboarding flow
    Then I should be asked for my age
    And I should be asked for my gender
    And my profile should be saved
    And I should see the Dashboard tab

  Scenario: Import WHOOP CSV data
    Given I have completed onboarding
    And I have a WHOOP CSV export file with 30 days of data
    When I navigate to the Import screen
    And I select my WHOOP CSV file
    Then I should see "30 records imported"
    And my HRV readings should be stored
    And I should be redirected to the Dashboard

  Scenario: View HRV trend with benchmark
    Given I have imported 30 days of WHOOP data
    And my average HRV is 52ms
    When I view the Dashboard
    Then I should see a line chart of my HRV over time
    And I should see a 7-day rolling average line
    And I should see a horizontal benchmark line at 48ms
    And I should see my percentile displayed as "58th percentile"

  Scenario: View HRV statistics
    Given I have imported WHOOP data
    When I view the Dashboard
    Then I should see my current HRV value
    And I should see my 7-day average
    And I should see my 30-day average
    And I should see my percentile for my age/gender

  Scenario: Data persists after app restart
    Given I have imported WHOOP data
    And I have set up my profile
    When I close the app completely
    And I reopen the app
    Then my profile should still show my age and gender
    And my HRV data should still be displayed
    And my Dashboard should show the same statistics
```

### TDD Test Outlines

#### T1.1: Project Setup
```typescript
// No unit tests - verification is manual (app runs on device)
// Integration test: app launches without crash
describe('App Launch', () => {
  it('should render the root layout');
  it('should display tab navigation with 4 tabs');
  it('should navigate between tabs');
});
```

#### T1.2: User Profile & Storage
```typescript
describe('UserStore', () => {
  describe('setProfile', () => {
    it('should store age as a number');
    it('should store gender as male/female/other');
    it('should set createdAt timestamp');
    it('should generate unique id');
  });

  describe('persistence', () => {
    it('should save profile to AsyncStorage');
    it('should load profile from AsyncStorage on init');
    it('should handle missing profile gracefully');
  });
});

describe('Onboarding Flow', () => {
  it('should validate age is between 18 and 100');
  it('should require gender selection');
  it('should navigate to Dashboard after completion');
  it('should skip onboarding if profile exists');
});
```

#### T1.3: WHOOP CSV Import
```typescript
describe('WhoopParser', () => {
  describe('parseCSV', () => {
    it('should extract HRV (ms) from "Heart rate variability (ms)" column');
    it('should extract resting HR from "Resting heart rate (bpm)" column');
    it('should extract recovery score from "Recovery score" column');
    it('should extract date from "Cycle start time" column');
    it('should handle missing values gracefully');
    it('should skip rows with invalid data');
    it('should return array of HRVReading objects');
  });

  describe('date parsing', () => {
    it('should parse "2024-01-15 06:30:00" format');
    it('should normalize to YYYY-MM-DD string');
    it('should handle timezone variations');
  });
});

describe('HrvStore', () => {
  describe('importReadings', () => {
    it('should add new readings to store');
    it('should update existing readings by date');
    it('should persist to AsyncStorage');
    it('should return count of imported records');
  });

  describe('getReadingsByDateRange', () => {
    it('should return readings within date range');
    it('should sort by date ascending');
  });
});
```

#### T1.4: HRV Dashboard
```typescript
describe('HRV Percentile Calculator', () => {
  describe('getAgeBracket', () => {
    it('should return "18-25" for age 20');
    it('should return "26-35" for age 30');
    it('should return "36-45" for age 40');
    it('should return "46-55" for age 50');
    it('should return "56-65" for age 60');
    it('should return "65+" for age 70');
  });

  describe('getBenchmark', () => {
    it('should return {p25: 40, p50: 60, p75: 80} for male 26-35');
    it('should return {p25: 38, p50: 55, p75: 75} for female 26-35');
  });

  describe('getPercentile', () => {
    it('should return 50 when HRV equals p50 benchmark');
    it('should return 25 when HRV equals p25 benchmark');
    it('should return 75 when HRV equals p75 benchmark');
    it('should interpolate between benchmarks');
    it('should cap at 99 for very high HRV');
    it('should return low percentile for HRV below p25');
  });
});

describe('Statistics Calculator', () => {
  describe('calculateAverage', () => {
    it('should calculate mean HRV from readings');
    it('should handle empty array');
  });

  describe('calculateRollingAverage', () => {
    it('should calculate 7-day rolling average');
    it('should handle fewer than 7 days of data');
  });

  describe('getLatestReading', () => {
    it('should return most recent HRV reading');
  });
});
```

---

## FEATURE: Log My Habits (Milestone 2)

### BDD Specification

```gherkin
Feature: Habit Tracking
  As a user
  I want to log my daily habits
  So that I can correlate them with my HRV

  Background:
    Given I have completed onboarding
    And I have imported WHOOP data

  Scenario: Log daily habits
    Given it is a new day I haven't logged
    When I navigate to the Habits tab
    Then I should see a daily check-in form
    And I should be able to log:
      | Category   | Fields                              |
      | Sleep      | hours (0-12), quality (1-5)         |
      | Exercise   | type, duration (mins), intensity    |
      | Alcohol    | consumed (yes/no), units            |
      | Meditation | practiced (yes/no), duration (mins) |
      | Caffeine   | last intake time                    |
      | Stress     | level (1-5)                         |
      | Cold       | exposure (yes/no)                   |
    And I should be able to add notes

  Scenario: Save habit entry
    Given I am on the habit logging form
    When I fill in my sleep as 7.5 hours, quality 4
    And I mark meditation as yes, 20 minutes
    And I set stress level to 2
    And I tap "Save"
    Then my habit entry should be saved for today
    And I should see a confirmation message
    And the calendar should show today as logged

  Scenario: View habit calendar
    Given I have logged habits for 14 days
    When I view the Habits tab
    Then I should see a calendar with logged days highlighted
    And I should see my current logging streak
    And I should be able to tap a day to view/edit that entry

  Scenario: Edit past habit entry
    Given I have a habit entry for yesterday
    When I tap on yesterday in the calendar
    Then I should see yesterday's habit data pre-filled
    And I should be able to modify the values
    And save the updated entry

  Scenario: View habits on HRV chart
    Given I have both HRV data and habit data for the past week
    When I view the Dashboard
    Then I should see small icons on the HRV chart data points
    And tapping a data point should show that day's habits
    And I should see a "Log Today" prompt if today isn't logged
```

### TDD Test Outlines

#### T2.1: Habit Data Model
```typescript
describe('HabitEntry Interface', () => {
  it('should have required fields: id, date, sleep, alcohol, meditation, stressLevel, coldExposure');
  it('should have optional fields: exercise, caffeine, notes');
});

describe('HabitStore', () => {
  describe('addEntry', () => {
    it('should create new entry with generated id');
    it('should store entry by date');
    it('should persist to AsyncStorage');
  });

  describe('updateEntry', () => {
    it('should update existing entry by id');
    it('should merge partial updates');
  });

  describe('getEntryByDate', () => {
    it('should return entry for given date');
    it('should return undefined if no entry exists');
  });

  describe('getEntriesInRange', () => {
    it('should return entries between start and end dates');
    it('should sort by date');
  });

  describe('linkToHrv', () => {
    it('should find HRV reading for same date as habit');
    it('should handle missing HRV data');
  });
});
```

#### T2.2: Habit Logging UI
```typescript
describe('HabitForm Component', () => {
  describe('Sleep Section', () => {
    it('should render hours slider from 0 to 12');
    it('should render quality rating 1-5');
    it('should show decimal hours (7.5)');
  });

  describe('Exercise Section', () => {
    it('should toggle visibility when "Did you exercise?" is answered');
    it('should render type picker with options');
    it('should render duration input');
    it('should render intensity selector');
  });

  describe('Substances Section', () => {
    it('should render alcohol yes/no toggle');
    it('should show units input when alcohol=yes');
    it('should render caffeine time picker');
  });

  describe('Wellness Section', () => {
    it('should render meditation toggle');
    it('should show duration when meditation=yes');
    it('should render stress level 1-5');
    it('should render cold exposure toggle');
  });

  describe('Form Submission', () => {
    it('should validate required fields');
    it('should call onSubmit with HabitEntry');
    it('should show success message');
  });
});
```

#### T2.3: Habit History & Calendar
```typescript
describe('HabitCalendar Component', () => {
  describe('rendering', () => {
    it('should display current month');
    it('should highlight days with logged habits');
    it('should show different color for today');
    it('should allow month navigation');
  });

  describe('interactions', () => {
    it('should call onDayPress with date');
    it('should show streak count');
  });
});

describe('Streak Calculator', () => {
  describe('calculateStreak', () => {
    it('should return consecutive days ending at today');
    it('should return 0 if today not logged');
    it('should handle gaps in logging');
  });
});
```

#### T2.4: Dashboard Integration
```typescript
describe('HRV Chart with Habits', () => {
  describe('data point decoration', () => {
    it('should show indicator when habit data exists for date');
    it('should show different indicators for different habits');
  });

  describe('tooltip', () => {
    it('should show habit summary on point tap');
    it('should display sleep hours, meditation, alcohol');
  });
});

describe('Log Today Prompt', () => {
  it('should show when today has no habit entry');
  it('should hide when today is logged');
  it('should navigate to Habits tab on tap');
});
```

---

## FEATURE: Understand My Patterns (Milestone 3)

### BDD Specification

```gherkin
Feature: Habit-HRV Correlation Analysis
  As a user
  I want to see which habits correlate with my HRV
  So that I know what actually works for me

  Background:
    Given I have 30+ days of HRV data
    And I have 30+ days of habit data

  Scenario: View positive correlation
    Given I meditated on 15 days with average HRV of 55ms
    And I did not meditate on 15 days with average HRV of 45ms
    When I view the Insights tab
    Then I should see a card for "Meditation"
    And it should show "Your HRV is 22% higher on days you meditate"
    And it should show correlation strength as "Strong"

  Scenario: View negative correlation
    Given I consumed alcohol on 10 days with average HRV of 40ms
    And I did not consume alcohol on 20 days with average HRV of 52ms
    When I view the Insights tab
    Then I should see a card for "Alcohol"
    And it should show "Your HRV is 23% lower on days you drink"
    And it should be flagged as negative impact

  Scenario: View ranked habit impacts
    Given I have correlations for multiple habits
    When I view the Insights tab
    Then I should see habits ranked by impact strength
    And the strongest positive correlation should be at the top
    And I should see a bar chart visualizing relative impacts

  Scenario: Insufficient data warning
    Given I have only 7 days of meditation data
    When I view the Insights tab
    Then I should see "Need more data" for meditation
    And I should see "Log 14+ days for reliable insights"

  Scenario: Time-lag correlation
    Given my HRV tends to be higher the day AFTER I exercise
    When I view the Insights tab
    Then I should see "Exercise (next day effect)"
    And it should show the delayed correlation
```

### TDD Test Outlines

#### T3.1: Correlation Engine
```typescript
describe('Pearson Correlation Calculator', () => {
  describe('calculateCorrelation', () => {
    it('should return 1 for perfect positive correlation');
    it('should return -1 for perfect negative correlation');
    it('should return 0 for no correlation');
    it('should handle real-world data with moderate correlation');
    it('should return 0 for constant values (no variance)');
  });

  describe('edge cases', () => {
    it('should handle arrays of length 2');
    it('should throw for mismatched array lengths');
    it('should throw for empty arrays');
  });
});

describe('Statistical Significance', () => {
  describe('calculateSignificance', () => {
    it('should return "high" for n>=30 and |r|>=0.5');
    it('should return "medium" for n>=14 and |r|>=0.3');
    it('should return "low" for small samples or weak correlation');
  });

  describe('calculatePValue', () => {
    it('should calculate p-value from correlation and sample size');
    it('should return low p-value for strong correlations');
  });
});
```

#### T3.2: Correlation Analysis
```typescript
describe('Habit Data Preparation', () => {
  describe('prepareBinaryHabit', () => {
    it('should convert boolean habit to 0/1 array');
    it('should align with HRV dates');
    it('should handle missing habit days');
  });

  describe('prepareNumericHabit', () => {
    it('should extract numeric values (sleep hours, etc)');
    it('should normalize to comparable scale');
  });
});

describe('Correlation Analyzer', () => {
  describe('analyzeAllHabits', () => {
    it('should calculate correlation for each habit type');
    it('should calculate average HRV with vs without');
    it('should calculate percentage difference');
    it('should include sample size');
  });

  describe('analyzeWithTimeLag', () => {
    it('should shift habit data by 1 day');
    it('should correlate yesterday habit with today HRV');
    it('should handle edge cases at data boundaries');
  });

  describe('rankByImpact', () => {
    it('should sort by absolute correlation coefficient');
    it('should put positive impacts first when equal');
  });
});
```

#### T3.3: Insights UI
```typescript
describe('CorrelationCard Component', () => {
  describe('rendering', () => {
    it('should display habit name');
    it('should display percentage change');
    it('should show positive change in green');
    it('should show negative change in red');
    it('should show correlation strength badge');
    it('should show sample size');
  });

  describe('insufficient data state', () => {
    it('should show "Need more data" message');
    it('should show progress toward minimum samples');
  });
});

describe('Impact Chart Component', () => {
  describe('rendering', () => {
    it('should show horizontal bar for each habit');
    it('should scale bars relative to max impact');
    it('should show positive bars to right, negative to left');
  });
});
```

---

## FEATURE: Improve My HRV (Milestone 4)

### BDD Specification

```gherkin
Feature: Personalized Recommendations
  As a user
  I want personalized recommendations to improve my HRV
  So that I can take action on what works for me

  Background:
    Given I have sufficient data for correlation analysis
    And meditation shows +20% HRV correlation
    And alcohol shows -15% HRV correlation
    And I meditate 3/7 days per week
    And I drink 2/7 days per week

  Scenario: View Today's Focus
    Given it is Monday morning
    When I view the Dashboard
    Then I should see "Today's Focus" card
    And it should recommend "Try meditation today"
    And it should show the expected HRV impact

  Scenario: View Weekly Plan
    Given I am on the Insights tab
    When I tap "Weekly Plan"
    Then I should see a 7-day plan
    And each day should have 1-2 focus items
    And items should be based on my correlation data
    And I should be able to mark items as "tried"

  Scenario: Set HRV Goal
    Given my current average HRV is 48ms
    And the 75th percentile for my age/gender is 65ms
    When I go to Profile settings
    And I set my goal to "75th percentile"
    Then I should see my target as 65ms
    And the Dashboard should show progress toward goal

  Scenario: Track Progress
    Given I have a goal set
    And my HRV has improved from 48ms to 55ms over 30 days
    When I view the Dashboard
    Then I should see "Improving" trend indicator
    And I should see progress bar toward goal
    And I should see "7 days at or above goal"

  Scenario: Earn Achievement
    Given I have logged habits for 7 consecutive days
    When I complete day 7
    Then I should see "7-Day Streak" achievement unlocked
    And the achievement should be saved to my profile
```

### TDD Test Outlines

#### T4.1: Recommendation Engine
```typescript
describe('Recommendation Generator', () => {
  describe('generateRecommendations', () => {
    it('should prioritize habits with highest positive correlation');
    it('should suggest increasing positive habits user does infrequently');
    it('should suggest decreasing negative habits user does frequently');
    it('should filter out habits user already does consistently (>5/7 days)');
    it('should limit to top 3-5 recommendations');
  });

  describe('calculateImpactScore', () => {
    it('should multiply correlation by potential frequency change');
    it('should weight by statistical significance');
  });

  describe('formatRecommendation', () => {
    it('should generate actionable text: "Try meditation today"');
    it('should include expected impact: "+20% HRV on meditation days"');
  });
});
```

#### T4.2: Today's Focus & Weekly Plan
```typescript
describe('TodaysFocus Component', () => {
  describe('selection logic', () => {
    it('should pick top recommendation not done today');
    it('should rotate recommendations across week');
    it('should consider day of week patterns');
  });

  describe('rendering', () => {
    it('should show recommendation text');
    it('should show expected impact');
    it('should show "Mark as tried" button');
  });
});

describe('WeeklyPlan Component', () => {
  describe('plan generation', () => {
    it('should distribute recommendations across 7 days');
    it('should not overload any single day');
    it('should balance positive additions and negative reductions');
  });

  describe('tracking', () => {
    it('should persist tried/not-tried status');
    it('should show completion percentage');
  });
});
```

#### T4.3: Goals & Progress
```typescript
describe('Goal Setting', () => {
  describe('percentile goals', () => {
    it('should convert percentile to target HRV using benchmarks');
    it('should store goal in user profile');
  });
});

describe('Progress Tracker', () => {
  describe('calculateProgress', () => {
    it('should return 0-100% toward goal');
    it('should handle case where current > goal');
  });

  describe('detectTrend', () => {
    it('should return "improving" if 7-day avg > 14-day avg by 5%');
    it('should return "declining" if 7-day avg < 14-day avg by 5%');
    it('should return "stable" otherwise');
  });

  describe('countDaysAtGoal', () => {
    it('should count consecutive days HRV >= target');
    it('should reset count on days below target');
  });
});
```

#### T4.4: Achievements & Motivation
```typescript
describe('Achievement System', () => {
  describe('logging achievements', () => {
    it('should unlock "7-Day Streak" at 7 consecutive days');
    it('should unlock "30-Day Streak" at 30 consecutive days');
    it('should unlock "Data Pioneer" after first import');
  });

  describe('progress achievements', () => {
    it('should unlock "On Target" for 7 days at goal');
    it('should unlock "HRV Improver" for 10% improvement');
  });

  describe('persistence', () => {
    it('should save unlocked achievements');
    it('should not re-trigger already unlocked');
    it('should track unlock date');
  });
});

describe('AchievementBadge Component', () => {
  it('should show locked state for unearned');
  it('should show unlocked state with date for earned');
  it('should animate on new unlock');
});
```

---

## FEATURE: Polish & Scale (Milestone 5 - Future)

### BDD Specification (Outline)

```gherkin
Feature: WHOOP API Integration
  Scenario: Connect WHOOP account
  Scenario: Auto-sync daily data
  Scenario: Handle API errors gracefully

Feature: Push Notifications
  Scenario: Receive habit logging reminder
  Scenario: Receive weekly summary
  Scenario: Configure notification preferences

Feature: Cloud Sync
  Scenario: Backup data to cloud
  Scenario: Restore data on new device
  Scenario: Handle sync conflicts
```

---

## Data Models

```typescript
// Core Types
interface UserProfile {
  id: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  targetPercentile: number; // e.g., 75 = above average
  createdAt: Date;
}

interface HRVReading {
  id: string;
  date: string; // YYYY-MM-DD
  hrvMs: number; // RMSSD in milliseconds
  restingHR: number;
  recoveryScore?: number; // WHOOP recovery %
  source: 'whoop_csv' | 'whoop_api' | 'manual';
  rawData?: object;
}

interface HabitEntry {
  id: string;
  date: string; // YYYY-MM-DD
  sleep: {
    hours: number;
    quality: 1 | 2 | 3 | 4 | 5;
    bedtime?: string;
  };
  exercise?: {
    type: string;
    durationMins: number;
    intensity: 'low' | 'medium' | 'high';
  };
  alcohol: {
    consumed: boolean;
    units?: number;
  };
  meditation: {
    practiced: boolean;
    durationMins?: number;
  };
  caffeine?: {
    lastIntakeTime: string;
    mgEstimate?: number;
  };
  stressLevel: 1 | 2 | 3 | 4 | 5;
  coldExposure: boolean;
  notes?: string;
}

interface Correlation {
  habitKey: string;
  habitLabel: string;
  coefficient: number; // -1 to 1
  avgHrvWith: number;
  avgHrvWithout: number;
  sampleSize: number;
  significance: 'high' | 'medium' | 'low';
}
```

---

## HRV Benchmark Data

```typescript
// RMSSD values by age and gender (50th percentile)
const HRV_BENCHMARKS = {
  male: {
    '18-25': { p25: 50, p50: 78, p75: 100 },
    '26-35': { p25: 40, p50: 60, p75: 80 },
    '36-45': { p25: 35, p50: 48, p75: 65 },
    '46-55': { p25: 30, p50: 40, p75: 55 },
    '56-65': { p25: 25, p50: 35, p75: 48 },
    '65+':   { p25: 20, p50: 30, p75: 42 },
  },
  female: {
    '18-25': { p25: 45, p50: 70, p75: 90 },
    '26-35': { p25: 38, p50: 55, p75: 75 },
    '36-45': { p25: 32, p50: 45, p75: 60 },
    '46-55': { p25: 28, p50: 38, p75: 52 },
    '56-65': { p25: 24, p50: 33, p75: 45 },
    '65+':   { p25: 20, p50: 28, p75: 40 },
  },
};
```

---

## Key Algorithms

### Correlation Calculation
```typescript
// Pearson correlation between habit (binary/numeric) and HRV
function calculateCorrelation(
  habitValues: number[],
  hrvValues: number[]
): number {
  const n = habitValues.length;
  const sumX = habitValues.reduce((a, b) => a + b, 0);
  const sumY = hrvValues.reduce((a, b) => a + b, 0);
  const sumXY = habitValues.reduce((sum, x, i) => sum + x * hrvValues[i], 0);
  const sumX2 = habitValues.reduce((sum, x) => sum + x * x, 0);
  const sumY2 = hrvValues.reduce((sum, y) => sum + y * y, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
  );

  return denominator === 0 ? 0 : numerator / denominator;
}
```

### Age-Adjusted Percentile
```typescript
function getPercentile(hrv: number, age: number, gender: string): number {
  const bracket = getAgeBracket(age);
  const benchmarks = HRV_BENCHMARKS[gender][bracket];

  if (hrv <= benchmarks.p25) return 25 * (hrv / benchmarks.p25);
  if (hrv <= benchmarks.p50) return 25 + 25 * ((hrv - benchmarks.p25) / (benchmarks.p50 - benchmarks.p25));
  if (hrv <= benchmarks.p75) return 50 + 25 * ((hrv - benchmarks.p50) / (benchmarks.p75 - benchmarks.p50));
  return Math.min(99, 75 + 25 * ((hrv - benchmarks.p75) / benchmarks.p75));
}
```

---

## WHOOP CSV Format

WHOOP exports contain these relevant columns:
- `Cycle start time` - Date of measurement
- `Recovery score` - 0-100%
- `Resting heart rate (bpm)`
- `Heart rate variability (ms)` - RMSSD
- `Sleep performance (%)`
- `Hours of sleep`
- `Day Strain`

---

## Verification & Testing

### For Each Tracer Bullet:
1. **Unit tests**: Core logic functions
2. **Manual test**: Run on device/simulator
3. **Data verification**: Check stored data matches expected

### End-to-End Test Scenario:
1. Create new profile (age 35, male)
2. Import WHOOP CSV with 30 days of data
3. Log habits for 14 days
4. View dashboard - verify HRV chart shows benchmark line at ~48ms
5. View correlations - verify "meditation" shows positive correlation
6. View recommendations - verify actionable suggestions appear

---

## Task-by-Task File Map

### T1.1: Project Setup
```
hrv-app/
├── package.json
├── app.json
├── tsconfig.json
├── babel.config.js
├── app/
│   ├── _layout.tsx
│   └── (tabs)/
│       ├── _layout.tsx
│       ├── dashboard.tsx    (placeholder)
│       ├── habits.tsx       (placeholder)
│       ├── insights.tsx     (placeholder)
│       └── profile.tsx      (placeholder)
└── types/
    └── index.ts
```

### T1.2: User Profile & Storage
```
├── stores/
│   └── userStore.ts
├── lib/
│   └── storage.ts
├── app/
│   └── onboarding.tsx
└── components/
    └── OnboardingForm.tsx
```

### T1.3: WHOOP Data Import
```
├── stores/
│   └── hrvStore.ts
├── lib/
│   └── whoop/
│       └── parser.ts
├── app/
│   └── import.tsx
└── components/
    └── ImportButton.tsx
```

### T1.4: HRV Dashboard
```
├── constants/
│   └── benchmarks.ts
├── lib/
│   └── hrv/
│       ├── percentile.ts
│       └── statistics.ts
└── components/
    ├── HRVChart.tsx
    └── StatsCard.tsx
```

### T2.1-T2.4: Habit Tracking
```
├── stores/
│   └── habitStore.ts
└── components/
    ├── HabitForm.tsx
    ├── HabitCalendar.tsx
    ├── HabitHistory.tsx
    └── LogTodayPrompt.tsx
```

### T3.1-T3.3: Correlations
```
├── lib/
│   └── correlations/
│       ├── calculator.ts
│       ├── analyzer.ts
│       └── significance.ts
└── components/
    ├── CorrelationCard.tsx
    └── ImpactChart.tsx
```

### T4.1-T4.4: Recommendations & Goals
```
├── lib/
│   └── recommendations/
│       └── engine.ts
├── stores/
│   └── achievementStore.ts
└── components/
    ├── TodaysFocus.tsx
    ├── WeeklyPlan.tsx
    ├── ProgressIndicator.tsx
    └── AchievementBadge.tsx
```

---

## Test File Structure

```
__tests__/
├── lib/
│   ├── whoop/
│   │   └── parser.test.ts          # T1.3
│   ├── hrv/
│   │   ├── percentile.test.ts      # T1.4
│   │   └── statistics.test.ts      # T1.4
│   ├── correlations/
│   │   ├── calculator.test.ts      # T3.1
│   │   ├── analyzer.test.ts        # T3.2
│   │   └── significance.test.ts    # T3.1
│   └── recommendations/
│       └── engine.test.ts          # T4.1
├── stores/
│   ├── userStore.test.ts           # T1.2
│   ├── hrvStore.test.ts            # T1.3
│   └── habitStore.test.ts          # T2.1
└── features/                        # BDD/Integration tests
    ├── seeMyHrv.test.ts            # M1
    ├── logMyHabits.test.ts         # M2
    ├── understandPatterns.test.ts  # M3
    └── improveMyHrv.test.ts        # M4
```

---

## Development Workflow

### For Each Task:

1. **Write Tests First (TDD)**
   - Create test file with outlined tests
   - Run tests (they should fail - red)
   - Implement minimum code to pass
   - Refactor if needed

2. **Verify Task Complete**
   - All unit tests pass
   - Manual verification on device
   - Code committed

### For Each Milestone:

1. **Run BDD Feature Tests**
   - Execute integration tests for the feature
   - Verify all scenarios pass

2. **User Acceptance Test**
   - Test with real WHOOP data
   - Verify the "What User Sees" matches expectation

---

## Execution Order

```
START
  │
  ▼
┌─────────────────────────────────────────────────────────────┐
│ M1: See My HRV                                              │
│   T1.1 ──► T1.2 ──► T1.3 ──► T1.4                          │
│   (setup)  (profile) (import) (dashboard)                   │
│                                                             │
│   BDD Test: "Feature: HRV Data Visualization" - all pass   │
└─────────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────────┐
│ M2: Log My Habits                                           │
│   T2.1 ──► T2.2 ──► T2.3                                   │
│   (model)  (form)   (history)                               │
│      │                 │                                    │
│      └────────► T2.4 ◄─┘                                   │
│              (dashboard integration)                        │
│                                                             │
│   BDD Test: "Feature: Habit Tracking" - all pass           │
└─────────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────────┐
│ M3: Understand My Patterns                                  │
│   T3.1 ──► T3.2 ──► T3.3                                   │
│   (engine) (analysis) (UI)                                  │
│                                                             │
│   BDD Test: "Feature: Habit-HRV Correlation" - all pass    │
└─────────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────────┐
│ M4: Improve My HRV                                          │
│   T4.1 ──► T4.2                                            │
│   (engine) (plans)                                          │
│      │                                                      │
│   T4.3 ──► T4.4                                            │
│   (goals)  (achievements)                                   │
│                                                             │
│   BDD Test: "Feature: Personalized Recommendations" - pass │
└─────────────────────────────────────────────────────────────┘
  │
  ▼
 MVP COMPLETE
```
