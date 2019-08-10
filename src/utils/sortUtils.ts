// https://web.archive.org/web/20141119215047/http://jsperf.com/javascript-quicksort-comparisons
// based on work from Vladimir Yaroslavskiy:
// https://web.archive.org/web/20151002230717/http://iaroslavski.narod.ru/quicksort/DualPivotQuicksort.pdf
type QuicksortComparator<T> = (left: T, right: T) => number;

function swap<T>(arr: T[], i: number, j: number) {
  const temp = arr[i];
  arr[i] = arr[j];
  arr[j] = temp;
}
function dualPivotQuicksort<T>(
  arr: T[],
  comp: QuicksortComparator<T>,
  left: number,
  right: number,
  div: number
): T[] {
  const len = right - left;
  let i;
  let j;
  if (len < 27) {
    // insertion sort for tiny array
    for (i = left + 1; i <= right; i++) {
      for (j = i; j > left && comp(arr[j], arr[j - 1]) < 0; j--) {
        swap(arr, j, j - 1);
      }
    }
    return arr;
  }
  const third = Math.floor(len / div); // TODO: check if we need to round up or down or just nearest
  let m1 = left + third;
  let m2 = right - third; // 'medians'
  if (m1 <= left) {
    m1 = left + 1;
  }
  if (m2 >= right) {
    m2 = right - 1;
  }
  if (comp(arr[m1], arr[m2]) < 0) {
    swap(arr, m1, left);
    swap(arr, m2, right);
  } else {
    swap(arr, m1, right);
    swap(arr, m2, left);
  }
  const pivot1 = arr[left];
  const pivot2 = arr[right]; // pivots
  let less = left + 1;
  let great = right - 1; // pointers
  for (i = less; i <= great; i++) {
    // sorting
    if (comp(arr[i], pivot1) < 0) {
      swap(arr, i, less++);
    } else if (comp(arr[i], pivot2) > 0) {
      while (i < great && comp(arr[great], pivot2) > 0) {
        great--;
      }
      swap(arr, i, great--);
      if (comp(arr[i], pivot1) < 0) {
        swap(arr, i, less++);
      }
    }
  }
  const dist = great - less; // swaps
  if (dist < 13) {
    div++;
  }
  swap(arr, less - 1, left);
  swap(arr, great + 1, right);
  dualPivotQuicksort(arr, comp, left, less - 2, div); // subarrays
  dualPivotQuicksort(arr, comp, great + 2, right, div);
  if (dist > len - 13 && pivot1 !== pivot2) {
    // equal elements
    for (i = less; i <= great; i++) {
      if (arr[i] === pivot1) {
        swap(arr, i, less++);
      } else if (arr[i] === pivot2) {
        swap(arr, i, great--);
        if (arr[i] === pivot1) {
          swap(arr, i, less++);
        }
      }
    }
  }
  if (comp(pivot1, pivot2) < 0) {
    return dualPivotQuicksort(arr, comp, less, great, div); // subarray
  }
  return arr;
}

export function sort<T>(
  array: T[],
  comparison: QuicksortComparator<T>,
  fromIndex: number,
  toIndex: number
) {
  // not astral-plane safe
  const len = array.length || 0;
  let fromIdx =
    typeof fromIndex === "symbol" ||
    toString.call(fromIndex) === "[object Symbol]"
      ? 0
      : Math.min(fromIndex || 0, len) || 0;
  let toIdx =
    typeof toIndex === "symbol" || toString.call(toIndex) === "[object Symbol]"
      ? 0
      : Math.min(toIndex || len, len);
  if (toIdx !== toIdx) {
    // check against NaN
    toIdx = len;
  }
  if (fromIdx < 0) {
    // support negative indexes
    fromIdx = Math.max(0, len + fromIdx);
  }
  if (toIdx < 0) {
    toIdx = Math.max(0, len + toIdx);
  }
  if (fromIdx < toIdx) {
    dualPivotQuicksort(array, comparison, fromIdx, toIdx - 1, 3);
  } else if (toIdx < fromIdx) {
    dualPivotQuicksort(array, comparison, toIdx, fromIdx - 1, 3);
  } else {
    return array;
  }
}

export function comparatorString(s1: string, s2: string) {
  const n1 = s1.length;
  const n2 = s2.length;
  const min = Math.min(n1, n2);

  for (let i = 0; i < min; i++) {
    const c1 = s1.charCodeAt(i);
    const c2 = s2.charCodeAt(i);
    if (c1 !== c2) {
      // ???? No overflow because of numeric promotion
      return c1 - c2;
    }
  }

  return n1 - n2;
}

export function comparatorNumber(a: number, b: number) {
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
}
