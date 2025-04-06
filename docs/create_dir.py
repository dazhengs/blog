import datetime
import os
# Change working directory to script location
script_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(script_dir)

begin_date = datetime.date(2025, 4, 3)
end_date = datetime.date(2025, 12, 31)

while begin_date <= end_date:
    blog_path = f"blog/{begin_date.year}/{begin_date.month :02d}/{begin_date.day :02d}"
    command = os.makedirs(blog_path, exist_ok=True)
    print(blog_path)
    begin_date = begin_date + datetime.timedelta(days=1)
