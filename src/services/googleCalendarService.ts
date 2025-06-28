import { googleAuthService } from './googleAuthService';
import type { Event, Holiday } from '../types/calendar';

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  start: {
    date?: string;
    dateTime?: string;
    timeZone?: string;
  };
  end: {
    date?: string;
    dateTime?: string;
    timeZone?: string;
  };
  description?: string;
  colorId?: string;
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
  creator?: {
    email?: string;
    displayName?: string;
  };
  htmlLink?: string;
}

interface GoogleCalendarList {
  id: string;
  summary: string;
  primary?: boolean;
  backgroundColor?: string;
}

class GoogleCalendarService {
  private readonly baseUrl = 'https://www.googleapis.com/calendar/v3';
  private readonly holidayApiKey = import.meta.env.VITE_GOOGLE_HOLIDAY_API_KEY;

  /**
   * ユーザーのカレンダー一覧を取得（OAuth認証が必要）
   */
  async getCalendarList(): Promise<GoogleCalendarList[]> {
    const token = await googleAuthService.getValidAccessToken();
    if (!token) {
      throw new Error('認証が必要です');
    }

    const response = await fetch(`${this.baseUrl}/users/me/calendarList`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`カレンダー一覧の取得に失敗: ${response.status}`);
    }

    const data = await response.json();
    return data.items || [];
  }

  /**
   * 指定したカレンダーのイベントを取得（OAuth認証が必要）
   */
  async getEvents(
    calendarId: string = 'primary',
    timeMin?: string,
    timeMax?: string
  ): Promise<Event[]> {
    const token = await googleAuthService.getValidAccessToken();
    if (!token) {
      throw new Error('認証が必要です');
    }

    const params = new URLSearchParams({
      singleEvents: 'true',
      orderBy: 'startTime',
    });

    if (timeMin) params.append('timeMin', timeMin);
    if (timeMax) params.append('timeMax', timeMax);

    const response = await fetch(
      `${this.baseUrl}/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`イベントの取得に失敗: ${response.status}`);
    }

    const data = await response.json();
    return this.convertGoogleEventsToEvents(data.items || []);
  }

  /**
   * 指定した月のイベントを取得（OAuth認証が必要）
   */
  async getEventsForMonth(year: number, month: number): Promise<Event[]> {
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);
    
    const timeMin = startOfMonth.toISOString();
    const timeMax = endOfMonth.toISOString();

    return this.getEvents('primary', timeMin, timeMax);
  }

  /**
   * 日本の祝日を取得（APIキー認証）
   */
  async getHolidays(year: number): Promise<Holiday[]> {
    // APIキーが設定されていない場合はモックデータを返す
    if (!this.holidayApiKey) {
      console.warn('祝日APIキーが設定されていません。モックデータを使用します。');
      return this.getMockHolidays(year);
    }

    const calendarId = 'ja.japanese.official#holiday@group.v.calendar.google.com';
    const timeMin = `${year}-01-01T00:00:00Z`;
    const timeMax = `${year}-12-31T23:59:59Z`;

    try {
      const params = new URLSearchParams({
        key: this.holidayApiKey,
        timeMin,
        timeMax,
        singleEvents: 'true',
        orderBy: 'startTime',
      });

      const response = await fetch(
        `${this.baseUrl}/calendars/${encodeURIComponent(calendarId)}/events?${params}`
      );

      if (!response.ok) {
        throw new Error(`祝日の取得に失敗: ${response.status}`);
      }

      const data = await response.json();
      return data.items
        .filter((item: any) => {
          // 銀行休業日や大晦日などを除外
          return !item.summary.includes('銀行休業日') && 
                 !item.summary.includes('大晦日');
        })
        .map((item: any) => ({
          date: item.start.date,
          name: item.summary,
          description: item.description,
        }));

    } catch (error) {
      console.error('祝日取得エラー:', error);
      return this.getMockHolidays(year);
    }
  }

  /**
   * イベントを作成（OAuth認証が必要）
   */
  async createEvent(
    title: string,
    startDate: string,
    endDate?: string,
    description?: string,
    calendarId: string = 'primary'
  ): Promise<Event> {
    const token = await googleAuthService.getValidAccessToken();
    if (!token) {
      throw new Error('認証が必要です');
    }

    const eventData = {
      summary: title,
      start: {
        date: startDate,
      },
      end: {
        date: endDate || startDate,
      },
      description,
    };

    const response = await fetch(
      `${this.baseUrl}/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      }
    );

    if (!response.ok) {
      throw new Error(`イベントの作成に失敗: ${response.status}`);
    }

    const data = await response.json();
    return this.convertGoogleEventToEvent(data);
  }

  /**
   * イベントを更新（OAuth認証が必要）
   */
  async updateEvent(
    eventId: string,
    title: string,
    startDate: string,
    endDate?: string,
    description?: string,
    calendarId: string = 'primary'
  ): Promise<Event> {
    const token = await googleAuthService.getValidAccessToken();
    if (!token) {
      throw new Error('認証が必要です');
    }

    const eventData = {
      summary: title,
      start: {
        date: startDate,
      },
      end: {
        date: endDate || startDate,
      },
      description,
    };

    const response = await fetch(
      `${this.baseUrl}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      }
    );

    if (!response.ok) {
      throw new Error(`イベントの更新に失敗: ${response.status}`);
    }

    const data = await response.json();
    return this.convertGoogleEventToEvent(data);
  }

  /**
   * イベントを削除（OAuth認証が必要）
   */
  async deleteEvent(eventId: string, calendarId: string = 'primary'): Promise<void> {
    const token = await googleAuthService.getValidAccessToken();
    if (!token) {
      throw new Error('認証が必要です');
    }

    const response = await fetch(
      `${this.baseUrl}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`イベントの削除に失敗: ${response.status}`);
    }
  }

  /**
   * GoogleカレンダーのイベントをEvent型に変換
   */
  private convertGoogleEventsToEvents(googleEvents: GoogleCalendarEvent[]): Event[] {
    return googleEvents.map((googleEvent) => this.convertGoogleEventToEvent(googleEvent));
  }

  /**
   * 単一のGoogleカレンダーイベントをEvent型に変換
   */
  private convertGoogleEventToEvent(googleEvent: GoogleCalendarEvent): Event {
    // 開始時間と終了時間を取得
    const startTime = googleEvent.start.dateTime || 
                     (googleEvent.start.date ? `${googleEvent.start.date}T00:00:00` : undefined);
    const endTime = googleEvent.end.dateTime || 
                   (googleEvent.end.date ? `${googleEvent.end.date}T23:59:59` : undefined);
    
    // 参加者のメールアドレスを取得
    const attendees = googleEvent.attendees?.map(attendee => 
      attendee.displayName || attendee.email
    ) || [];

    // 作成者の名前またはメールアドレスを取得
    const creator = googleEvent.creator?.displayName || googleEvent.creator?.email;

    return {
      id: googleEvent.id,
      title: googleEvent.summary || '無題',
      date: googleEvent.start.date || googleEvent.start.dateTime?.split('T')[0] || '',
      type: 'personal',
      color: '#10B981', // 緑色
      startTime,
      endTime,
      location: googleEvent.location,
      description: googleEvent.description,
      attendees: attendees.length > 0 ? attendees : undefined,
      creator,
      htmlLink: googleEvent.htmlLink,
    };
  }

  /**
   * モックデータ（APIキーが設定されていない場合）
   */
  private getMockHolidays(year: number): Holiday[] {
    if (year === 2025) {
      return [
        { date: '2025-01-01', name: '元日' },
        { date: '2025-01-13', name: '成人の日' },
        { date: '2025-02-11', name: '建国記念の日' },
        { date: '2025-02-23', name: '天皇誕生日' },
        { date: '2025-03-20', name: '春分の日' },
        { date: '2025-04-29', name: '昭和の日' },
        { date: '2025-05-03', name: '憲法記念日' },
        { date: '2025-05-04', name: 'みどりの日' },
        { date: '2025-05-05', name: 'こどもの日' },
        { date: '2025-07-21', name: '海の日' },
        { date: '2025-08-11', name: '山の日' },
        { date: '2025-09-15', name: '敬老の日' },
        { date: '2025-09-23', name: '秋分の日' },
        { date: '2025-10-13', name: 'スポーツの日' },
        { date: '2025-11-03', name: '文化の日' },
        { date: '2025-11-23', name: '勤労感謝の日' }
      ];
    }
    return [];
  }
}

export const googleCalendarService = new GoogleCalendarService(); 