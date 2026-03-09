import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler
} from 'chart.js';

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler
);

export const dashboardChartColors = {
  forest: '#166534',
  teal: '#0f766e',
  grain: '#ca8a04',
  amber: '#b45309',
  sky: '#0284c7',
  leaf: '#65a30d',
  slate: '#475569',
  red: '#b91c1c',
  surface: '#ffffff',
  grid: 'rgba(148, 163, 184, 0.18)',
  label: '#334155',
  muted: '#64748b',
  fill: 'rgba(22, 101, 52, 0.12)'
};

const chartPalette = [
  dashboardChartColors.forest,
  dashboardChartColors.teal,
  dashboardChartColors.grain,
  dashboardChartColors.sky,
  dashboardChartColors.amber,
  dashboardChartColors.leaf,
  dashboardChartColors.slate
];

const tonalPalettes = {
  forest: ['#166534', '#1f7a46', '#2b8a57', '#43a06d', '#68b389', '#93c8ac'],
  teal: ['#0f766e', '#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4'],
  grain: ['#a16207', '#b45309', '#ca8a04', '#d97706', '#eab308', '#facc15'],
  sky: ['#0369a1', '#0284c7', '#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd']
};

const toNumber = (value) => Number(value || 0);

const formatCompact = (value) =>
  new Intl.NumberFormat('en-UG', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(toNumber(value));

export const formatCurrencyValue = (value) =>
  new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(toNumber(value));

export const buildTonalPalette = (count, tone = 'forest') => {
  const palette = tonalPalettes[tone] || chartPalette;
  return Array.from({ length: count }, (_, index) => palette[index % palette.length]);
};

const baseLegend = {
  position: 'bottom',
  labels: {
    usePointStyle: true,
    boxWidth: 10,
    padding: 16,
    color: dashboardChartColors.label,
    font: {
      size: 11,
      weight: '600'
    }
  }
};

const baseTickStyle = {
  color: dashboardChartColors.muted,
  padding: 8,
  font: {
    size: 11,
    weight: '600'
  }
};

const axisTicks = (formatter) => ({
  grid: {
    color: dashboardChartColors.grid,
    drawBorder: false
  },
  border: {
    display: false
  },
  ticks: {
    ...baseTickStyle,
    callback: formatter,
    maxRotation: 0
  }
});

const baseTooltip = (formatter) => ({
  backgroundColor: 'rgba(15, 23, 42, 0.94)',
  titleColor: '#f8fafc',
  bodyColor: '#e2e8f0',
  padding: 12,
  cornerRadius: 10,
  displayColors: false,
  callbacks: {
    label(context) {
      return formatter(context);
    }
  }
});

export const dashboardChartOptions = {
  doughnutCurrency: {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    layout: {
      padding: 8
    },
    plugins: {
      legend: baseLegend,
      tooltip: baseTooltip((context) => `${context.label}: ${formatCurrencyValue(context.raw)}`)
    }
  },
  lineCurrency: {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    layout: {
      padding: {
        top: 6,
        right: 8
      }
    },
    elements: {
      line: {
        borderWidth: 3
      },
      point: {
        radius: 3,
        hoverRadius: 5
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: baseTooltip((context) => `Sales: ${formatCurrencyValue(context.raw)}`)
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: baseTickStyle
      },
      y: {
        ...axisTicks((value) => `UGX ${formatCompact(value)}`),
        beginAtZero: true
      }
    }
  },
  groupedBarCurrency: {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        right: 8
      }
    },
    plugins: {
      legend: baseLegend,
      tooltip: baseTooltip(
        (context) => `${context.dataset.label}: ${formatCurrencyValue(context.raw)}`
      )
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: baseTickStyle
      },
      y: {
        ...axisTicks((value) => `UGX ${formatCompact(value)}`),
        beginAtZero: true
      }
    }
  },
  barCurrency: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: baseTooltip((context) => `Amount: ${formatCurrencyValue(context.raw)}`)
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: baseTickStyle
      },
      y: {
        ...axisTicks((value) => `UGX ${formatCompact(value)}`),
        beginAtZero: true
      }
    }
  },
  barKg: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: baseTooltip(
        (context) => `Tonnage: ${toNumber(context.raw).toLocaleString('en-UG')} kg`
      )
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: baseTickStyle
      },
      y: {
        ...axisTicks((value) => `${formatCompact(value)} kg`),
        beginAtZero: true
      }
    }
  },
  horizontalBarCurrency: {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: baseTooltip((context) => `Amount: ${formatCurrencyValue(context.raw)}`)
    },
    scales: {
      y: {
        grid: { display: false },
        border: { display: false },
        ticks: baseTickStyle
      },
      x: {
        ...axisTicks((value) => `UGX ${formatCompact(value)}`),
        beginAtZero: true
      }
    }
  },
  horizontalBarKg: {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: baseTooltip(
        (context) => `Stock: ${toNumber(context.raw).toLocaleString('en-UG')} kg`
      )
    },
    scales: {
      y: {
        grid: { display: false },
        border: { display: false },
        ticks: baseTickStyle
      },
      x: {
        ...axisTicks((value) => `${formatCompact(value)} kg`),
        beginAtZero: true
      }
    }
  }
};
