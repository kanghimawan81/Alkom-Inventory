export interface MasterStandar {
  kategori: string;
  namaAlat: string;
  jumlahWajib: number;
}

export interface Inventaris {
  kategori: string;
  namaAlat: string;
  jumlah: number;
  kondisi: string;
}

export interface MetricsResult {
  summary: {
    totalStandar: number;
    totalTergelar: number;
    persentaseKesiapan: number;
    kondisi: {
      BAIK: number;
      RUSAK: number;
    }
  };
  comparison: {
    kategori: string;
    namaAlat: string;
    standar: number;
    tergelar: number;
    gap: number;
  }[];
}

export function calculateMetrics(standar: MasterStandar[], tergelar: Inventaris[]): MetricsResult {
  let totalStandar = 0;
  let totalTergelar = 0;
  
  const kondisi = {
    BAIK: 0,
    RUSAK: 0
  };

  const comparisonMap = new Map<string, {
    kategori: string,
    namaAlat: string,
    standar: number,
    tergelar: number
  }>();

  // Process master data
  for (const item of standar) {
    totalStandar += item.jumlahWajib;
    comparisonMap.set(item.namaAlat, {
      kategori: item.kategori,
      namaAlat: item.namaAlat,
      standar: item.jumlahWajib,
      tergelar: 0
    });
  }

  // Process actual inventory
  for (const item of tergelar) {
    totalTergelar += item.jumlah;
    
    // Increment condition counters
    if (item.kondisi === 'BAIK') kondisi.BAIK += item.jumlah;
    else if (item.kondisi === 'RUSAK') kondisi.RUSAK += item.jumlah;
    
    if (comparisonMap.has(item.namaAlat)) {
      comparisonMap.get(item.namaAlat)!.tergelar += item.jumlah;
    } else {
      comparisonMap.set(item.namaAlat, {
        kategori: item.kategori,
        namaAlat: item.namaAlat,
        standar: 0,
        tergelar: item.jumlah
      });
    }
  }

  const comparison = Array.from(comparisonMap.values()).map(c => ({
    ...c,
    gap: c.tergelar - c.standar
  }));

  // Sort comparison by category, then gap asc (worst first)
  comparison.sort((a, b) => {
    if (a.kategori === b.kategori) {
      return a.gap - b.gap;
    }
    return a.kategori.localeCompare(b.kategori);
  });

  const siapPakai = kondisi.BAIK;
  const persentaseKesiapan = totalStandar === 0 ? 0 : parseFloat(((siapPakai / totalStandar) * 100).toFixed(2));

  return {
    summary: {
      totalStandar,
      totalTergelar,
      persentaseKesiapan,
      kondisi
    },
    comparison
  };
}
