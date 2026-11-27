import { NextResponse, type NextRequest } from 'next/server';

/**
 * Tải ảnh VietQR về máy: img.vietqr.io không bật CORS nên trình duyệt không tự tải được.
 * Route cùng origin này lấy ảnh PNG phía server rồi trả về dạng tệp đính kèm.
 * Chỉ dựng URL tới img.vietqr.io từ tham số đã kiểm tra — không proxy URL tuỳ ý.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const bank = q.get('bank') ?? 'MB';
  const account = q.get('account') ?? '';
  const amount = q.get('amount') ?? '';
  const addInfo = (q.get('addInfo') ?? '').slice(0, 200);
  const accountName = (q.get('accountName') ?? '').slice(0, 100);
  const fileName = (q.get('fileName') ?? 'QR-thanh-toan').replace(/[^\w.-]+/g, '-').slice(0, 80);

  if (
    !/^[A-Z0-9]{2,20}$/i.test(bank) ||
    !/^\d{6,20}$/.test(account) ||
    !/^\d{1,12}$/.test(amount)
  ) {
    return NextResponse.json({ message: 'Tham số mã QR không hợp lệ' }, { status: 400 });
  }

  const url =
    `https://img.vietqr.io/image/${bank}-${account}-compact2.png` +
    `?amount=${amount}&addInfo=${encodeURIComponent(addInfo)}&accountName=${encodeURIComponent(accountName)}`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(String(res.status));
    return new NextResponse(await res.arrayBuffer(), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${fileName}.png"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json(
      { message: 'Không tải được mã QR, vui lòng thử lại' },
      { status: 502 },
    );
  }
}
